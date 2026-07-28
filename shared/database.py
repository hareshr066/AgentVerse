import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Default SQLite URL in case DATABASE_URL is not set or points to PG
# We want database.db in the repository root or shared database directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "database.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")

# If we want SQLite override specifically for this setup:
if "sqlite" in DATABASE_URL or not DATABASE_URL.startswith("postgresql"):
    # Target SQLite database.db
    if not DATABASE_URL.startswith("sqlite"):
        DATABASE_URL = f"sqlite:///{DB_PATH}"

# Connection settings matching sqlite or postgresql
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
