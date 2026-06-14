from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db, Base
import models, schemas, auth
import random
import datetime
import logging
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
from typing import Dict, List, Optional

load_dotenv()

# ---------------- DATABASE ----------------
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CoCook Real-Time API")

# ---------------- ENV ----------------
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# ---------------- CORS ----------------
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = (
    [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
    if allowed_origins_str else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- HEALTH ----------------
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "cocook-api"}

# ---------------- WEBSOCKET MANAGER ----------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.all_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, user_id: Optional[int] = None):
        await websocket.accept()
        self.all_connections.append(websocket)
        if user_id is not None:
            self.active_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: Optional[int] = None):
        if websocket in self.all_connections:
            self.all_connections.remove(websocket)
        if user_id and user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for conn in self.active_connections[user_id]:
                try:
                    await conn.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# ---------------- EMAIL ----------------
def send_real_email(to_email: str, otp_code: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not all([smtp_server, smtp_port, smtp_username, smtp_password]):
        logging.warning("SMTP not configured")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "CoCook OTP"
        msg["From"] = smtp_username
        msg["To"] = to_email

        html = f"<h2>Your OTP is {otp_code}</h2>"
        msg.attach(MIMEText(html, "html"))

        port = int(smtp_port)

        if port == 465:
            with smtplib.SMTP_SSL(smtp_server, port) as server:
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_username, to_email, msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, port) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_username, to_email, msg.as_string())

        return True

    except Exception as e:
        logging.error(f"Email error: {e}")
        return False

# ---------------- AUTH HELPERS ----------------
def get_current_user(token: str, db: Session):
    payload = auth.decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    return db.query(models.User).filter(models.User.id == int(user_id)).first()

# ---------------- OTP ----------------
@app.post("/auth/send-otp")
def send_otp(request: schemas.OTPRequest, db: Session = Depends(get_db)):
    otp_code = str(random.randint(100000, 999999))

    db.add(models.OTP(email=request.email, otp_code=otp_code))
    db.commit()

    email_sent = send_real_email(request.email, otp_code)

    logging.info(f"OTP for {request.email}: {otp_code}")

    return {
        "message": "OTP sent" if email_sent else "OTP generated (check logs)",
        "real_email": email_sent
    }

@app.post("/auth/verify-otp", response_model=schemas.Token)
def verify_otp(request: schemas.OTPVerify, db: Session = Depends(get_db)):
    otp = db.query(models.OTP).filter(
        models.OTP.email == request.email,
        models.OTP.otp_code == request.otp
    ).order_by(models.OTP.created_at.desc()).first()

    if not otp:
        raise HTTPException(400, "Invalid OTP")

    user = db.query(models.User).filter(models.User.email == request.email).first()

    if not user:
        user = models.User(
            email=request.email,
            name=request.name or request.email.split("@")[0],
            auth_provider="email"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    db.query(models.OTP).filter(models.OTP.email == request.email).delete()
    db.commit()

    token = auth.create_access_token({"sub": str(user.id)})

    return {"access_token": token, "token_type": "bearer", "user": user}

# ---------------- ✅ FIXED GOOGLE LOGIN ----------------
@app.post("/auth/google", response_model=schemas.Token)
def google_auth(request: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(500, "GOOGLE_CLIENT_ID missing")

        # 🔴 FIXED PART (MAIN ISSUE RESOLVED HERE)
        try:
            idinfo = id_token.verify_oauth2_token(
                request.token,
                google_requests.Request(),
                GOOGLE_CLIENT_ID
            )
        except Exception as e:
            logging.error(f"Google token error: {e}")
            raise HTTPException(400, "Invalid Google token")

        email = idinfo.get("email")
        if not email:
            raise HTTPException(400, "Email not found in Google token")

        name = idinfo.get("name", email.split("@")[0])
        avatar = idinfo.get("picture", "")

        user = db.query(models.User).filter(models.User.email == email).first()

        if not user:
            user = models.User(
                email=email,
                name=name,
                avatar=avatar,
                auth_provider="google"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        token = auth.create_access_token({"sub": str(user.id)})

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Google auth failed: {e}")
        raise HTTPException(500, "Google authentication failed")

# ---------------- (ALL YOUR OTHER ROUTES UNCHANGED) ----------------
# Community, Feed, Friends, Stories, AI, WebSocket remain SAME as your code
