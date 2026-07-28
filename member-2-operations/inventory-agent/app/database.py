from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# Create a reusable synchronous database engine for Neon PostgreSQL
# Set connect_timeout=5 to fail fast if network connectivity is blocked/unstable
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,  # Set to True for debugging SQL statements
    pool_pre_ping=True,
    pool_recycle=300,
    future=True,
    connect_args={"connect_timeout": 5}
)

# Create the SessionLocal class for synchronous DB operations
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

# Define Base class using modern DeclarativeBase for ORM models
class Base(DeclarativeBase):
    pass
