import os
import re
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("shared.database")

# Load environment variables from .env file if available
_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
load_dotenv(os.path.join(_current_dir, ".env"))
load_dotenv(os.path.join(_parent_dir, ".env"))
load_dotenv()

RAW_DATABASE_URL = os.environ.get("DATABASE_URL")

def mask_url(url: str | None) -> str:
    if not url:
        return "Not Set"
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", url)

if RAW_DATABASE_URL:
    logger.info("DATABASE_URL detected: %s", mask_url(RAW_DATABASE_URL))
else:
    logger.info("DATABASE_URL not set in environment. Using default fallback configuration.")

NEON_DB_URL = "postgresql://neondb_owner:npg_bYFkg6K2iJWz@ep-withered-shape-axrygj8o-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL = RAW_DATABASE_URL or NEON_DB_URL

sync_db_url = DATABASE_URL
if sync_db_url.startswith("postgresql+asyncpg://"):
    sync_db_url = sync_db_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
elif sync_db_url.startswith("postgres://"):
    sync_db_url = sync_db_url.replace("postgres://", "postgresql://")

connect_args = {}
if sync_db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(sync_db_url, connect_args=connect_args, pool_pre_ping=True)
except Exception as err:
    logger.error("Failed to initialize primary database engine: %s", str(err))
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DB_PATH = os.path.join(BASE_DIR, "database.db")
    engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Reusable FastAPI dependency that yields a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connection() -> bool:
    """
    Quickly tests if the database connection is alive.
    Returns True if reachable, False otherwise.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error("Database connection check failed: %s", str(exc))
        return False
