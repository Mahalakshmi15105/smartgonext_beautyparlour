import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-123!")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-dev-secret-key-123!")
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root:@localhost:3306/smartgonext_beauty_saas"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    # Meta Developer Portal Credentials
    META_APP_ID = os.getenv("META_APP_ID", "YOUR_META_APP_ID")
    META_APP_SECRET = os.getenv("META_APP_SECRET", "YOUR_META_APP_SECRET")
