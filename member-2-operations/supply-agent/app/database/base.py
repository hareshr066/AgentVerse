from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """
    Base class using DeclarativeBase for all ORM models in SQLAlchemy 2.x.
    All agent models will inherit from this class.
    """
    pass
