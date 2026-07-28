from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    INVENTORY_AGENT_URL: str = "http://localhost:8003"
    SUPPLY_AGENT_URL: str = "http://localhost:8004"
    PRODUCTION_AGENT_URL: str = "http://localhost:8005"
    DEMAND_AGENT_URL: str = "http://localhost:8002"
    EVENT_AGENT_URL: str = "http://localhost:8001"
    RECOMMENDATION_AGENT_URL: str = "http://localhost:8006"
    
    APP_NAME: str = "Multi-Agent Orchestrator"
    APP_VERSION: str = "1.0.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
