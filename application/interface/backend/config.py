"""
MediTrack Patient Portal - Configuration Module
Loads environment variables and provides configuration classes
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration class"""
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY')
    FLASK_APP = os.environ.get('FLASK_APP', 'backend/app.py')
    
    # Database Configuration
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'wellness')
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
    
    # Database Connection String
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_POOL_SIZE = int(os.environ.get('DATABASE_POOL_SIZE', 20))
    SQLALCHEMY_MAX_OVERFLOW = int(os.environ.get('DATABASE_MAX_OVERFLOW', 10))
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES', 2592000)))
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # Session Configuration
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'True') == 'True'
    SESSION_COOKIE_HTTPONLY = os.environ.get('SESSION_COOKIE_HTTPONLY', 'True') == 'True'
    SESSION_COOKIE_SAMESITE = os.environ.get('SESSION_COOKIE_SAMESITE', 'Lax')
    PERMANENT_SESSION_LIFETIME = timedelta(seconds=int(os.environ.get('PERMANENT_SESSION_LIFETIME', 3600)))
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5000').split(',')
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.environ.get('RATELIMIT_STORAGE_URL', 'memory://')
    RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', '100 per hour')
    
    # Security Headers (Flask-Talisman)
    TALISMAN_FORCE_HTTPS = True
    TALISMAN_STRICT_TRANSPORT_SECURITY = True
    TALISMAN_CONTENT_SECURITY_POLICY = {
        'default-src': "'self'",
        'script-src': "'self'",
        'style-src': "'self'",
        'img-src': "'self' data:",
    }
    
    # Encryption
    FIELD_ENCRYPTION_KEY = os.environ.get('FIELD_ENCRYPTION_KEY', '')
    
    # MFA Configuration
    MFA_ISSUER_NAME = os.environ.get('MFA_ISSUER_NAME', 'MediTrack Patient Portal')
    
    # Audit Logging
    AUDIT_LOG_ENABLED = os.environ.get('AUDIT_LOG_ENABLED', 'True') == 'True'
    AUDIT_LOG_LEVEL = os.environ.get('AUDIT_LOG_LEVEL', 'INFO')
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16777216))  # 16MB
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    ALLOWED_EXTENSIONS = set(os.environ.get('ALLOWED_EXTENSIONS', 'pdf,dcm,jpg,jpeg,png').split(','))
    
    # Email Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.example.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@meditrack.com')
    
    # Application URLs
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:5000')
    
    # Compliance Settings
    HIPAA_AUDIT_ENABLED = os.environ.get('HIPAA_AUDIT_ENABLED', 'True') == 'True'
    GDPR_CONSENT_REQUIRED = os.environ.get('GDPR_CONSENT_REQUIRED', 'True') == 'True'
    SESSION_TIMEOUT_MINUTES = int(os.environ.get('SESSION_TIMEOUT_MINUTES', 30))
    
    # Password Policy
    PASSWORD_MIN_LENGTH = int(os.environ.get('PASSWORD_MIN_LENGTH', 12))
    PASSWORD_REQUIRE_SPECIAL = os.environ.get('PASSWORD_REQUIRE_SPECIAL', 'True') == 'True'
    PASSWORD_REQUIRE_NUMBER = os.environ.get('PASSWORD_REQUIRE_NUMBER', 'True') == 'True'
    PASSWORD_REQUIRE_UPPERCASE = os.environ.get('PASSWORD_REQUIRE_UPPERCASE', 'True') == 'True'
    
    # Performance Settings
    QUERY_TIMEOUT_SECONDS = int(os.environ.get('QUERY_TIMEOUT_SECONDS', 30))


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    TALISMAN_FORCE_HTTPS = False  # Disable HTTPS requirement in development


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    TALISMAN_FORCE_HTTPS = False
    
    # Use in-memory database for testing
    DB_NAME = 'wellness_test'
    SQLALCHEMY_DATABASE_URI = f"postgresql://{Config.DB_USER}:{Config.DB_PASSWORD}@{Config.DB_HOST}:{Config.DB_PORT}/{DB_NAME}"


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Ensure critical settings are set in production
    @classmethod
    def validate(cls):
        """Validate that all required production settings are configured"""
        required_settings = [
            'SECRET_KEY',
            'JWT_SECRET_KEY',
            'DB_PASSWORD',
            'FIELD_ENCRYPTION_KEY',
        ]
        
        missing = []
        for setting in required_settings:
            val = getattr(cls, setting)
            if not val or val == '' or val.startswith('dev-') or val.startswith('jwt-') or 'change-in-production' in val:
                missing.append(setting)

            # Length check for secrets
            if setting in ['SECRET_KEY', 'JWT_SECRET_KEY'] and val and len(val) < 32:
                missing.append(f"{setting}_too_short")

        # Rate limiting storage check
        if cls.RATELIMIT_STORAGE_URL.startswith('memory://'):
            missing.append('RATELIMIT_STORAGE_URL_INSECURE_DEFAULT')
        
        if missing:
            raise ValueError(f"CRITICAL SECURITY ERROR: Missing or insecure required production settings: {', '.join(missing)}. Deployment halted.")


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config(env=None):
    """Get configuration based on environment"""
    if env is None:
        env = os.environ.get('FLASK_ENV', 'production')
    
    config_class = config.get(env, config['production'])
    
    # Validate configuration
    if env == 'production':
        config_class.validate()
    else:
        # Minimal validation for development/testing
        if not config_class.SECRET_KEY or not config_class.JWT_SECRET_KEY:
            raise ValueError("SECRET_KEY and JWT_SECRET_KEY must be set in all environments.")
    
    return config_class
