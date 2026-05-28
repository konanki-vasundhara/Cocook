import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database Configuration — fully driven by DATABASE_URL environment variable
# Supports PostgreSQL (production) and SQLite (local development fallback)
# In production: set DATABASE_URL to your hosted PostgreSQL connection string
# Example: DATABASE_URL=postgresql://user:pass@host:5432/cocook
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cocook.db")

# Handle Render/Railway style postgres:// URLs (SQLAlchemy requires postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

logging.info(f"Database backend: {'PostgreSQL' if 'postgresql' in DATABASE_URL else 'SQLite'}")

# Engine configuration
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
