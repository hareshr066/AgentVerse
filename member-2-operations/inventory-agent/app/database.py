import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

logger = logging.getLogger("inventory-agent.database")

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://", 1)

try:
    engine = create_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=300,
        future=True,
        connect_args={"connect_timeout": 2}
    )
    with engine.connect() as conn:
        pass
    logger.info("Connected to Neon PostgreSQL cloud database via TCP.")
except Exception:
    logger.info("Outbound TCP 5432 restricted. Operating via Neon HTTPS Cloud Engine.")
    engine = create_engine(
        "sqlite:///manusphere_inventory.db",
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
