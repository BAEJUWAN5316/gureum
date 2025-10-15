import os
import smtplib
from email.message import EmailMessage
from fastapi import FastAPI, Form, Request, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
import uvicorn
import databases
import sqlalchemy
from datetime import datetime
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import EmailStr
from dotenv import load_dotenv

# .env 파일은 로컬 개발 시에만 사용됩니다.
load_dotenv()

# --- FastAPI 앱 초기화 ---
app = FastAPI()

# --- Rate Limiter 설정 ---
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# --- 앱 수명 주기 이벤트 (Startup/Shutdown) ---
@app.on_event("startup")
async def startup():
    # --- 이메일 설정을 startup 안으로 이동 ---
    # 앱이 시작될 때 환경 변수를 안전하게 읽어와 app.state에 저장합니다.
    app.state.email_config = {
        "MAIL_FROM": os.getenv("MAIL_FROM"),
        "MAIL_SERVER": os.getenv("MAIL_SERVER"),
        "MAIL_PORT": int(os.getenv("MAIL_PORT", 587)),
        "MAIL_USERNAME": os.getenv("MAIL_USERNAME"),
        "MAIL_PASSWORD": os.getenv("MAIL_PASSWORD"),
    }
    
    # --- 데이터베이스 설정 ---
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gureum.db")
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    database = databases.Database(DATABASE_URL)
    metadata = sqlalchemy.MetaData()

    # 구독자 테이블 정의
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
    if "sqlite" in DATABASE_URL:
        engine_args["connect_args"] = {"check_same_thread": False}
        
    engine = sqlalchemy.create_engine(DATABASE_URL, **engine_args)
    metadata.create_all(engine)
    
    # 다른 곳에서 재사용할 수 있도록 app.state에 저장
    app.state.database = database
    app.state.subscribers_table = subscribers
    
    await app.state.database.connect()


@app.on_event("shutdown")
async def shutdown():
    await app.state.database.disconnect()


# --- 이메일 전송 함수 (smtplib 사용) ---
# 이제 app.state에 저장된 설정값을 인자로 받습니다.
def send_email_background(recipient_email: str, subject: str, email_config: dict):
    if not all(email_config.values()):
        print("Email configuration is missing from app state. Skipping email.")
        return

    try:
        with open("email_template.html", "r", encoding="utf-8") as f:
            body_html = f.read()
    except FileNotFoundError:
        body_html = "<p>구독해주셔서 감사합니다.</p>"

    msg = EmailMessage()
    msg.set_content("Cloud No.7 구독이 완료되었습니다.")
    msg.add_alternative(body_html, subtype='html')
    
    msg["Subject"] = subject
    msg["From"] = email_config["MAIL_FROM"]
    msg["To"] = recipient_email

    try:
        with smtplib.SMTP(email_config["MAIL_SERVER"], email_config["MAIL_PORT"]) as server:
            server.starttls()
            server.login(email_config["MAIL_USERNAME"], email_config["MAIL_PASSWORD"])
            server.send_message(msg)
            print(f"Email successfully sent to {recipient_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")


# --- API 엔드포인트 ---
@app.post("/subscribe")
@limiter.limit("5/minute")
async def subscribe_form(
    request: Request,
    background_tasks: BackgroundTasks,
    email: EmailStr = Form(...), 
    name: str = Form(None), 
    ref: str = Form(None)
):
    db = request.app.state.database
    sub_table = request.app.state.subscribers_table
    
    try:
        query = sub_table.insert().values(
            email=email, 
            name=name, 
            ref=ref, 
            timestamp=datetime.utcnow()
        )
        await db.execute(query)
        
        subject = "Cloud No.7 구독해주셔서 감사합니다."
        # app.state에서 이메일 설정을 가져와 백그라운드 작업에 전달합니다.
        background_tasks.add_task(send_email_background, email, subject, request.app.state.email_config)

    except Exception as e:
        print(f"Error inserting data: {e}")
        # 실제 운영 시에는 여기서 에러 처리를 하는 것이 좋습니다.
        pass
            
    return RedirectResponse(url="/cloud_no7_success.html", status_code=303)

@app.get("/")
async def root():
    return FileResponse('cloud_no7_index.html')

# Mount static files
app.mount("/", StaticFiles(directory="."), name="static")

if __name__ == "__main__":
    uvicorn.run("main.app", host="0.0.0.0", port=8000, reload=True)

