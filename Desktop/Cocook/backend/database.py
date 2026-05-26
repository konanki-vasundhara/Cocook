import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL Configuration
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cocook")

fallback = False

# Check and automatically create target database in PostgreSQL server if it doesn't exist
try:
    import urllib.parse as urlparse
    result = urlparse.urlparse(SQLALCHEMY_DATABASE_URL)
    username = result.username or 'postgres'
    password = result.password or 'postgres'
    host = result.hostname or 'localhost'
    port = result.port or '5432'
    database = result.path.lstrip('/') or 'cocook'

    # Connect to the default 'postgres' database to check/create the target database
    conn = psycopg2.connect(
        dbname='postgres',
        user=username,
        password=password,
        host=host,
        port=str(port),
        connect_timeout=3
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{database}';")
    exists = cur.fetchone()
    if not exists:
        cur.execute(f"CREATE DATABASE {database};")
        print(f"PostgreSQL Database '{database}' created successfully!")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Warning: Failed to connect to PostgreSQL: {e}")
    print("Falling back to SQLite (sqlite:///./cocook.db) to keep server running. Please update password in backend/.env to connect to PostgreSQL.")
    fallback = True

# Initialize SQLAlchemy Engine with dynamic SQLite fallback
if fallback:
    engine = create_engine("sqlite:///./cocook.db", connect_args={"check_same_thread": False})
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
