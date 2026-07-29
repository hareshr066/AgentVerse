from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ManuSphere Event Agent"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql+asyncpg://neondb_owner:npg_bYFkg6K2iJWz@ep-withered-shape-axrygj8o-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
    NEWS_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    WEATHER_API_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()
