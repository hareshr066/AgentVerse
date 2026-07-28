from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
from app.database.connection import engine

# Create the session factory for database sessions
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

async def get_db():
    """
    FastAPI dependency that yields a database session and ensures it is
    properly closed after the request lifecycle completes.
    """
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
