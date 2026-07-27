from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "inventory-agent"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Database Configuration
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/manusphere"
    
    # CORS Configuration
    ALLOWED_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
