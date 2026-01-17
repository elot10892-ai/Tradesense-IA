import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')

if not os.path.exists(instance_path):
    os.makedirs(instance_path, exist_ok=True)

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'une_cle_secrete_par_defaut_difficile_a_deviner'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt_secret_par_defaut'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "https://votre-domaine-production.com"
    ]

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'sqlite:///' + os.path.join(instance_path, 'trading_platform_dev.db')

class ProductionConfig(Config):
    DEBUG = False
    # ⚠️ Ligne modifiée pour prod : /tmp autorisé pour l’écriture
    SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/trading_platform_prod.db'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
