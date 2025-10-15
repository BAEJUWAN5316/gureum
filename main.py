# main.py
import os
import smtplib
import logging
from email.message import EmailMessage
from datetime import datetime

from fastapi import FastAPI, Form, Request, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse

import uvicorn
import databases
import sqlalchemy

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

# ──────────────────────────────────────────────────────────────────────────────
# 0) 로깅 & 환경 감지
# ──────────────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

IS_RAILWAY = bool(os.getenv("RAILWAY_STATIC_URL") or os.getenv("RAILWAY_ENVIRONMENT"))
if not IS_RAILWAY:
    # 로컬 개발에서만 .env 로드
    logger.info("✅ Local mode detected. Loading .env ...")
    load_dotenv()
else:
    logger.info("🚀 Railway mode detected. Using Railway environment variables.")

# 디버깅: 핵심 키 몇 개만 찍어보자 (민감값은 앞/뒤만 일부 표시)
def _mask(v: str | None, keep: int = 3) -> str | None:
    if not v:
        return v
    return v[:keep] + "***" + v[-keep:]

for k in ["DATABASE_URL", "MAIL_FROM", "MAIL_SERVER", "MAIL_USERNAME", "PORT"]:
    logger.info(f"DEBUG {k} = {_mask(os.getenv(k))}")

# ──────────────────────────────────────────────────────────────────────────────
# 1) FastAPI 앱 & RateLimiter (프록시 고려)
# ──────────────────────────────────────────────────────────────────────────────
def client_ip(request: Request) -> str:
    """Railway/프록시 환경에서 X-Forwarded-For 우선 사용"""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return get_remote_address(request)

limiter = Limiter(key_func=client_ip)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ──────────────────────────────────────────────────────────────────────────────
# 2) 이메일/DB 설정 모델
# ──────────────────────────────────────────────────────────────────────────────
class EmailConfig(BaseModel):
    MAIL_FROM: str | None = None
    MAIL_SERVER: str | None = None
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))
    MAIL_USERNAME: str | None = None
    MAIL_PASSWORD: str | None = None

# ──────────────────────────────────────────────────────────────────────────────
# 3) 앱 수명주기: Startup / Shutdown
# ──────────────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    # 3-1) 이메일 설정 로드
    app.state.email_config = EmailConfig(
        MAIL_FROM=os.getenv("MAIL_FROM"),
        MAIL_SERVER=os.getenv("MAIL_SERVER"),
        MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
        MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    )
    logger.info(f"DEBUG email config loaded: {app.state.email_config.model_dump()}")

    # 3-2) 데이터베이스 설정
    db_url = os.getenv("DATABASE_URL", "sqlite:///./gureum.db")

    # Railway가 가끔 postgres:// 형태를 줄 수 있어 호환 처리
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    database = databases.Database(db_url)
    metadata = sqlalchemy.MetaData()

    # subscribers 테이블
    subscribers = sqlalchemy.Table(
        "subscribers",
        metadata,
        sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
        sqlalchemy.Column("email", sqlalchemy.String, unique=True, index=True),
        sqlalchemy.Column("name", sqlalchemy.String, nullable=True),
        sqlalchemy.Column("ref", sqlalchemy.String, nullable=True),
        sqlalchemy.Column("timestamp", sqlalchemy.DateTime, default=datetime.utcnow),
    )

    engine_args = {}
    if db_url.startswith("sqlite"):
        engine_args["connect_args"] = {"check_same_thread": False}

    engine = sqlalchemy.create_engine(db_url, **engine_args)
    metadata.create_all(engine)

    app.state.database = database
    app.state.subscribers_table = subscribers

    await app.state.database.connect()
    logger.info("✅ Database connected")

@app.on_event("shutdown")
async def shutdown():
    await app.state.database.disconnect()
    logger.info("🛑 Database disconnected")

# ──────────────────────────────────────────────────────────────────────────────
# 4) 이메일 전송 (Background)
# ──────────────────────────────────────────────────────────────────────────────
def send_email_background(recipient_email: str, subject: str, email_config: EmailConfig):
    # 필수 설정 체크
    required = [
        email_config.MAIL_FROM,
        email_config.MAIL_SERVER,
        email_config.MAIL_USERNAME,
        email_config.MAIL_PASSWORD,
        email_config.MAIL_PORT,
    ]
    if not all(required):
        logger.warning("⚠️ Email configuration missing. Skipping email send.")
        return

    # 템플릿 로드
    try:
        with open("email_template.html", "r", encoding="utf-8") as f:
            body_html = f.read()
    except FileNotFoundError:
        body_html = "<p>구독해주셔서 감사합니다.</p>"

    msg = EmailMessage()
    msg.set_content("Cloud No.7 구독이 완료되었습니다.")
    msg.add_alternative(body_html, subtype="html")
    msg["Subject"] = subject
    msg["From"] = email_config.MAIL_FROM
    msg["To"] = recipient_email

    try:
        with smtplib.SMTP(email_config.MAIL_SERVER, email_config.MAIL_PORT) as server:
            server.starttls()
            server.login(email_config.MAIL_USERNAME, email_config.MAIL_PASSWORD)
            server.send_message(msg)
            logger.info(f"📧 Email successfully sent to {recipient_email}")
    except Exception as e:
        logger.error(f"❌ Failed to send email: {e}")

# ──────────────────────────────────────────────────────────────────────────────
# 5) 엔드포인트
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/healthz")
async def healthz():
    return JSONResponse({"ok": True, "timestamp": datetime.utcnow().isoformat()})

@app.post("/subscribe")
@limiter.limit("5/minute")
async def subscribe_form(
    request: Request,
    background_tasks: BackgroundTasks,
    email: EmailStr = Form(...),
    name: str | None = Form(None),
    ref: str | None = Form(None),
):
    db = request.app.state.database
    sub_table = request.app.state.subscribers_table

    try:
        query = sub_table.insert().values(
            email=email,
            name=name,
            ref=ref,
            timestamp=datetime.utcnow(),
        )
        await db.execute(query)

        subject = "Cloud No.7 구독해주셔서 감사합니다."
        background_tasks.add_task(
            send_email_background, email, subject, request.app.state.email_config
        )
    except Exception as e:
        logger.error(f"❌ DB insert error: {e}")

    return RedirectResponse(url="/cloud_no7_success.html", status_code=303)

@app.get("/")
async def root():
    # 정적 루트 파일을 명시적으로 반환
    return FileResponse("cloud_no7_index.html")

# ⚠️ 주의: StaticFiles를 "/"에 마운트하면 라우트를 가릴 수 있어요.
# 안전하게 별도 경로로 마운트합니다. (예: /assets)
app.mount("/assets", StaticFiles(directory="."), name="assets")

# ──────────────────────────────────────────────────────────────────────────────
# 6) 앱 실행 (Railway는 PORT 환경변수 사용)
# ──────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))  # Railway는 PORT를 주입함
    uvicorn.run("main:app", host="0.0.0.0", port=port)
