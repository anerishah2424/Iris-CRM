import os

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-prism-secret-key')
    MAX_CONTENT_LENGTH = 25 * 1024 * 1024  # 25MB
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    
    # Rate limiting
    RATELIMIT_DEFAULT_STRATEGY = "fixed-window"
    RATELIMIT_STORAGE_URI = "memory://"
    
    # Security
    TALISMAN_FORCE_HTTPS = False  # Set to True in production with SSL
    
class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    CORS_RESOURCES = {r"/api/*": {"origins": "http://localhost:5173"}}

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    # Use environment variables for production
    TALISMAN_FORCE_HTTPS = True
    CORS_RESOURCES = {r"/api/*": {"origins": os.environ.get("ALLOWED_ORIGINS", "*").split(",")}}
