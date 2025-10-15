import os
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
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr
from typing import List

# --- Email Configuration ---
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_FROM"),
    MAIL_PORT = 587,
    MAIL_SERVER = os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

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

subscribers = sqlalchemy.Table(
    "subscribers",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("email", sqlalchemy.String, unique=True, index=True),
    sqlalchemy.Column("name", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("ref", sqlalchemy.String, nullable=True),
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
    query = subscribers.insert().values(
        email=email, 
        name=name, 
        ref=ref, 
        timestamp=datetime.utcnow()
    )
    try:
        await database.execute(query)
        
        # Send email in the background
        message = MessageSchema(
            subject="Cloud No.7 구독해주셔서 감사합니다.",
            recipients=[email],
            body="<p>구매해주셔서 감사합니다. 조금만 기다려주세요.</p>",
            subtype=MessageType.html
        )
        fm = FastMail(conf)
        background_tasks.add_task(fm.send_message, message)

    except Exception as e:
        print(f"Error inserting data or sending email: {e}")
        pass
    return RedirectResponse(url="/cloud_no7_success.html", status_code=303)

@app.get("/")
async def root():
    return FileResponse('cloud_no7_index.html')

app.mount("/", StaticFiles(directory="."), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
