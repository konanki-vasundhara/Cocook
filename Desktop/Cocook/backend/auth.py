import jwt
import datetime
import os
import secrets
import logging
from dotenv import load_dotenv

load_dotenv()

# SECRET_KEY must be set in production via environment variable
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if os.getenv("ENVIRONMENT", "development") == "production":
        raise RuntimeError("FATAL: SECRET_KEY environment variable is not set. Cannot start in production mode.")
    else:
        SECRET_KEY = secrets.token_hex(32)
        logging.warning("SECRET_KEY not set — generated ephemeral key for development. Set SECRET_KEY env var for production.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
