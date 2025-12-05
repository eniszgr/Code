from pydantic import BaseSettings
from dotenv import load_dotenv
load_dotenv()
class Settings(BaseSettings):
    HF_ID: str | None = None
    GOOGLE_API_KEY: str | None = None
    MODEL_NAME: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"

settings = Settings()
