from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# Normalize the connection string to use synchronous psycopg2 driver
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://", 1)

# Create a reusable synchronous database engine for Neon PostgreSQL
engine = create_engine(
    db_url,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=300,
    future=True,
    connect_args={"connect_timeout": 5}
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass
