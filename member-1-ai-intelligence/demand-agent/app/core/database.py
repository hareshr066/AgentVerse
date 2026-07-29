from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings
import os, logging

logger = logging.getLogger("demand-agent.database")

raw_url = settings.DATABASE_URL
# Strip +asyncpg or +aiosqlite if using standard psycopg2/sqlite
if "postgresql+asyncpg://" in raw_url:
    raw_url = raw_url.replace("postgresql+asyncpg://", "postgresql://")

connect_args = {}
if "sqlite" in raw_url:
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(raw_url, connect_args=connect_args, pool_pre_ping=True)
except Exception as e:
    logger.warning("Database connection error (%s). Using local SQLite fallback.", str(e))
    engine = create_engine("sqlite:///manusphere_fallback.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
