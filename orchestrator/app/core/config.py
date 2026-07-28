from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ManuSphere Orchestrator Gateway"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/manusphere"

    EVENT_AGENT_URL: str = "http://localhost:8001"
    DEMAND_AGENT_URL: str = "http://localhost:8005"
    INVENTORY_AGENT_URL: str = "http://localhost:8003"
    RECOMMENDATION_AGENT_URL: str = "http://localhost:8006"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()
