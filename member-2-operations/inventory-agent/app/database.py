import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

logger = logging.getLogger("inventory-agent.database")

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://", 1)

# Resilient connection strategy: Try Neon, fallback to SQLite if network is blocked
try:
    logger.info("Attempting connection to Neon database: %s", db_url)
    engine = create_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=300,
        future=True,
        connect_args={"connect_timeout": 3}
    )
    with engine.connect() as conn:
        pass
    logger.info("Successfully connected to Neon cloud database.")
except Exception as e:
    logger.warning("Neon cloud database connection failed: %s. Outbound port 5432 may be firewalled. Falling back to local SQLite database.", str(e))
    engine = create_engine(
        "sqlite:///manusphere_fallback.db",
        echo=False,
        future=True,
        connect_args={"timeout": 5}
    )

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    pass
