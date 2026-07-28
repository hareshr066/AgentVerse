from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ManuSphere Demand Agent"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/manusphere"
    GEMINI_API_KEY: str = ""
    EVENT_AGENT_URL: str = "http://localhost:8001"
    INVENTORY_AGENT_URL: str = "http://localhost:8002"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()
