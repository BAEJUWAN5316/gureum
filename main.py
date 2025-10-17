from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import HTMLResponse

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

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# Railway와 같은 클라우드 환경에서는 .env 파일을 사용하지 않으므로,
# 'RAILWAY_STATIC_URL' 같은 Railway 전용 변수가 있는지 확인하여
# 로컬 환경일 때만 load_dotenv()를 실행합니다。
if "RAILWAY_STATIC_URL" not in os.environ:
    print("Running in local environment, loading .env file.")
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
    # SendGrid를 사용하므로 smtplib 관련 설정은 필요 없습니다.
    # 하지만 MAIL_FROM은 SendGrid에서도 사용될 수 있으므로 유지합니다.
    app.state.email_config = {
        "MAIL_FROM": os.getenv("MAIL_FROM"),
    }
    
    # --- 디버깅 코드 ---
    print(f"DEBUG: Variables loaded at startup: {app.state.email_config}")
    
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
        sqlalchemy.Column("email", sqlalchemy.String, index=True), # Removed unique=True
        sqlalchemy.Column("name", sqlalchemy.String, nullable=True),
        sqlalchemy.Column("ref", sqlalchemy.String, nullable=True),
        sqlalchemy.Column("timestamp", sqlalchemy.DateTime, default=datetime.utcnow),
        sqlalchemy.Column("email_sent", sqlalchemy.Boolean, default=False), # New column
    )
    
    engine_args = {}
    if "sqlite" in DATABASE_URL:
        engine_args["connect_args"] = {"check_same_thread": False}
        
    engine = sqlalchemy.create_engine(DATABASE_URL, **engine_args)
    metadata.create_all(engine)
    
    app.state.database = database
    app.state.subscribers_table = subscribers
    
    await app.state.database.connect()


@app.on_event("shutdown")
async def shutdown():
    await app.state.database.disconnect()


# --- 이메일 전송 함수 (SendGrid 사용으로 변경) ---
async def send_email_background_with_update(recipient_email: str, subject: str, record_id: int):
    db = app.state.database # Access the database from app.state
    sub_table = app.state.subscribers_table

    sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
    mail_from = os.getenv("MAIL_FROM")

    if not sendgrid_api_key or not mail_from:
        print("SendGrid API Key or MAIL_FROM is missing. Skipping email.")
        return

    email_sent_successfully = False
    try:
        with open("email_template.html", "r", encoding="utf-8") as f:
            body_html = f.read()
    except FileNotFoundError:
        body_html = "<p>구독해주셔서 감사합니다.</p>"

    message = Mail(
        from_email=mail_from,
        to_emails=recipient_email,
        subject=subject,
        html_content=body_html
    )
    try:
        sendgrid_client = SendGridAPIClient(sendgrid_api_key)
        response = sendgrid_client.send(message)
        print(f"Email sent via SendGrid to {recipient_email}, Status Code: {response.status_code}")
        if response.status_code >= 200 and response.status_code < 300: # Check for successful status codes
            email_sent_successfully = True
    except Exception as e:
        print(f"Failed to send email via SendGrid: {e}")

    # Update email_sent status in the database
    if email_sent_successfully:
        update_query = sub_table.update().where(sub_table.c.id == record_id).values(email_sent=True)
        await db.execute(update_query)
        print(f"Updated email_sent status for record ID {record_id} to True.")
    else:
        print(f"Email sending failed for record ID {record_id}. email_sent status remains False.")


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

    # Check existing subscriptions for the email
    count_query = sqlalchemy.select(sqlalchemy.func.count()).select_from(sub_table).where(sub_table.c.email == email)
    existing_count = await db.fetch_val(count_query)

    if existing_count >= 3:
        # Redirect to a page indicating the limit has been reached
        # Or return a JSON response with an error message
        # For now, let's redirect to the buy page with an error parameter
        return RedirectResponse(url="/buy?error=limit_reached", status_code=303)

    try:
        # Insert the new subscription
        insert_query = sub_table.insert().values(
            email=email, 
            name=name, 
            ref=ref, 
            timestamp=datetime.utcnow(),
            email_sent=False # Initialize email_sent to False
        )
        last_record_id = await db.execute(insert_query)

        subject = "[Cloud No.7] 저희의 구름을 구매해주셔서 감사합니다."
        # Pass the record ID to the background task to update email_sent status
        background_tasks.add_task(send_email_background_with_update, email, subject, last_record_id)

    except Exception as e:
        print(f"Error inserting data or sending email: {e}")
        # Handle specific database errors if needed
        return RedirectResponse(url="/buy?error=db_error", status_code=303)
            
    return RedirectResponse(url="/success", status_code=303)

@app.get("/")
async def root():
    return FileResponse('cloud_no7_index.html')

@app.get("/buy")
async def buy_page():
    return FileResponse('cloud_no7_buy.html')

@app.get("/success")
async def success_page():
    return FileResponse('cloud_no7_success.html')

# Mount static files (excluding the ones handled by specific routes)
# app.mount("/", StaticFiles(directory="."), name="static") # Removed this line

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    if exc.status_code == 404:
        with open("404.html", "r", encoding="utf-8") as f:
            html_content = f.read()
        return HTMLResponse(content=html_content, status_code=404)
    return await request.app.default_exception_handlers[StarletteHTTPException](request, exc)


app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/game1", StaticFiles(directory="game_gawibawibo", html=True), name="game1")
app.mount("/game2", StaticFiles(directory="game_dinosaur", html=True), name="game2")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

