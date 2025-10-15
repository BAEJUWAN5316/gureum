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
load_dotenv()

# --- Email Sending Function ---
def send_email_background(recipient_email: str, subject: str):
    try:
        with open("email_template.html", "r", encoding="utf-8") as f:
            body_html = f.read()
    except FileNotFoundError:
        print("Error: email_template.html not found. Sending plain text fallback.")
        body_html = "<p>구독해주셔서 감사합니다.</p>"

    msg = EmailMessage()
    msg.set_content("Cloud No.7 구독이 완료되었습니다.")
    msg.add_alternative(body_html, subtype='html')
    msg["Subject"] = subject
    msg["From"] = os.getenv("MAIL_FROM")
    msg["To"] = recipient_email

    mail_server = os.getenv("MAIL_SERVER")
    mail_port = int(os.getenv("MAIL_PORT", 587))
    mail_username = os.getenv("MAIL_USERNAME")
    mail_password = os.getenv("MAIL_PASSWORD")

    if not all([mail_server, mail_port, mail_username, mail_password, msg["From"]]):
        print("Email configuration is missing. Skipping email.")
        return

    try:
        with smtplib.SMTP(mail_server, mail_port) as server:
            server.starttls()
            server.login(mail_username, mail_password)
            server.send_message(msg)
            print(f"Email successfully sent to {recipient_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")


# --- Rate Limiter Configuration ---
limiter = Limiter(key_func=get_remote_address)


# --- Database Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gureum.db")
is_production = DATABASE_URL.startswith("postgres")

if is_production:
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine_args = {}
if not is_production:
    engine_args["connect_args"] = {"check_same_thread": False}

database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# Define the subscribers table with new logic
subscribers = sqlalchemy.Table(
    "subscribers",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("email", sqlalchemy.String, index=True),
    sqlalchemy.Column("name", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("ref", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("is_sent", sqlalchemy.Boolean, default=False),
    sqlalchemy.Column("timestamp", sqlalchemy.DateTime, default=datetime.utcnow),
)

engine = sqlalchemy.create_engine(DATABASE_URL, **engine_args)
metadata.create_all(engine)


# --- FastAPI App ---
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.post("/subscribe")
@limiter.limit("5/minute")
async def subscribe_form(
    background_tasks: BackgroundTasks,
    request: Request, 
    email: EmailStr = Form(...), 
    name: str = Form(None), 
    ref: str = Form(None)
):
    # Check submission count for the email
    select_query = sqlalchemy.select(sqlalchemy.func.count()).where(subscribers.c.email == email)
    submission_count = await database.fetch_val(select_query)

    if submission_count >= 3:
        # Limit reached, redirect back with an error
        return RedirectResponse(url="/cloud_no7_buy.html?error=limit_reached", status_code=303)
    
    # If limit is not reached, proceed
    insert_query = subscribers.insert().values(
        email=email, 
        name=name, 
        ref=ref,
        is_sent=False, # Explicitly set new field
        timestamp=datetime.utcnow()
    )
    await database.execute(insert_query)
    
    # Send confirmation email
    subject = "Cloud No.7 구독해주셔서 감사합니다."
    background_tasks.add_task(send_email_background, email, subject)
            
    return RedirectResponse(url="/cloud_no7_success.html", status_code=303)

@app.get("/")
async def root():
    return FileResponse('cloud_no7_index.html')

app.mount("/", StaticFiles(directory="."), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
