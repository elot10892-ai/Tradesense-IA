import os
from dotenv import load_dotenv

# Définir le dossier de base du projet (le dossier backend)
basedir = os.path.abspath(os.path.dirname(__file__))
# Définir le chemin du dossier instance
instance_path = os.path.join(basedir, 'instance')

# S'assurer que le dossier instance existe
if not os.path.exists(instance_path):
    try:
        os.makedirs(instance_path)
    except OSError:
        pass

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

class Config:
    """Configuration de base pour l'application"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'une_cle_secrete_par_defaut_difficile_a_deviner'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt_secret_par_defaut'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Autoriser les origines CORS pour le frontend
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",  # Vite default
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
    """Configuration pour l'environnement de développement"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'sqlite:///' + os.path.join(instance_path, 'trading_platform_dev.db')


class ProductionConfig(Config):
    """Configuration pour l'environnement de production"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'trading_platform_prod.db')


# Dictionnaire des configurations disponibles
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}