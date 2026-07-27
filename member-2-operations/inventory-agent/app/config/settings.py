from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/manusphere"
    PORT: int = 8000
    
    APP_NAME: str = "Inventory Agent"
    APP_VERSION: str = "1.0.0"
    DEFAULT_ORDERING_COST: float = 500.0
    DEFAULT_HOLDING_COST: float = 50.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
