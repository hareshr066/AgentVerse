import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Ensure dotenv loads environment variables from local .env or root
_current_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_current_dir, "..", "..", ".env"))
load_dotenv()

DEFAULT_NEON_URL = "postgresql://neondb_owner:npg_bYFkg6K2iJWz@ep-withered-shape-axrygj8o-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"

class Settings(BaseSettings):
    PROJECT_NAME: str = "ManuSphere Recommendation Agent"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.environ.get("DATABASE_URL", DEFAULT_NEON_URL)
    GROQ_API_KEY: Optional[str] = os.environ.get("GROQ_API_KEY")
    GROK_API_KEY: Optional[str] = os.environ.get("GROK_API_KEY") or os.environ.get("XAI_API_KEY")
    GEMINI_API_KEY: Optional[str] = os.environ.get("GROQ_API_KEY") or os.environ.get("GROK_API_KEY") or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    PORT: Optional[int] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
