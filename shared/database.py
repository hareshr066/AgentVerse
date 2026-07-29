import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Default SQLite URL in case DATABASE_URL is not set or points to PG
# We want database.db in the repository root or shared database directory
NEON_DB_URL = "postgresql://neondb_owner:npg_bYFkg6K2iJWz@ep-withered-shape-axrygj8o-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL = os.environ.get("DATABASE_URL", NEON_DB_URL)

if DATABASE_URL.startswith("postgresql://"):
    # Convert postgresql:// to postgresql+psycopg2:// if needed or keep standard
    pass

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
except Exception:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DB_PATH = os.path.join(BASE_DIR, "database.db")
    engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
