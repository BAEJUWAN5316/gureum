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
from fastapi_mail import ConnectionConfig

# Load .env file for local developmentt
load_dotenv()

# --- FastAPI App Initialization ---
app = FastAPI()

# --- Rate Limiter Configuration ---
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# --- Lifespan Events (Startup/Shutdown) ---
@app.on_event("startup")
async def startup():
    # --- Email Configuration (now inside startup) ---
    app.state.email_conf = ConnectionConfig(
        MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
        MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
        MAIL_FROM = os.getenv("MAIL_FROM"),
        MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
        MAIL_SERVER = os.getenv("MAIL_SERVER"),
        MAIL_STARTTLS = True,
        MAIL_SSL_TLS = False,
        USE_CREDENTIALS = True,
        VALIDATE_CERTS = True
    )

    # --- Database Configuration (now inside startup) ---
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gureum.db")
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    database = databases.Database(DATABASE_URL)
    metadata = sqlalchemy.MetaData()

    # Define the subscribers tablee
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
    
    app.state.database = database
    app.state.subscribers_table = subscribers
    
    await app.state.database.connect()


@app.on_event("shutdown")
async def shutdown():
    await app.state.database.disconnect()


# --- Email Sending Function ---
async def send_email_background(recipient_email: str, subject: str, conf: ConnectionConfig):
    try:
        with open("email_template.html", "r", encoding="utf-8") as f:
            body_html = f.read()
    except FileNotFoundError:
        body_html = "<p>구독해주셔서 감사합니다.</p>"

    msg = EmailMessage()
    msg.set_content("Cloud No.7 구독이 완료되었습니다.")
    msg.add_alternative(body_html, subtype='html')
    msg["Subject"] = subject
    msg["From"] = conf.MAIL_FROM
    msg["To"] = recipient_email

    try:
        with smtplib.SMTP(conf.MAIL_SERVER, conf.MAIL_PORT) as server:
            server.starttls()
            server.login(conf.MAIL_USERNAME, conf.MAIL_PASSWORD)
            server.send_message(msg)
            print(f"Email successfully sent to {recipient_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")


# --- API Endpoints ---
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
        background_tasks.add_task(send_email_background, email, subject, request.app.state.email_conf)

    except Exception as e:
        print(f"Error inserting data: {e}")
        pass
            
    return RedirectResponse(url="/cloud_no7_success.html", status_code=303)

@app.get("/")
async def root():
    return FileResponse('cloud_no7_index.html')

@app.get("/debug-env")
async def debug_env():
    return {
        "mail_username": os.getenv("MAIL_USERNAME"),
        "mail_server": os.getenv("MAIL_SERVER"),
        "database_url_set": "Yes" if os.getenv("DATABASE_URL") else "No"
    }

# Mount static files
app.mount("/", StaticFiles(directory="."), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
