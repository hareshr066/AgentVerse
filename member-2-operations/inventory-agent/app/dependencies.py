from typing import Generator
from app.database import SessionLocal

def get_db() -> Generator:
    """
    FastAPI dependency that yields a database session and ensures it is
    properly closed after the request lifecycle completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
