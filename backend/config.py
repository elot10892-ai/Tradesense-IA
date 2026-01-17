import os
from dotenv import load_dotenv

# --- Définir les chemins ---
basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')

# Créer le dossier instance si inexistant
if not os.path.exists(instance_path):
    os.makedirs(instance_path, exist_ok=True)

# Charger les variables d'environnement depuis .env
load_dotenv()

# =================================================================
# Classe de configuration de base
# =================================================================
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'une_cle_secrete_par_defaut_difficile_a_deviner'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt_secret_par_defaut'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Cors autorisés pour le frontend
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


# =================================================================
# Configuration pour le développement (local)
# =================================================================
class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'sqlite:///' + os.path.join(instance_path, 'trading_platform_dev.db')


# =================================================================
# Configuration pour la production (Railway / PostgreSQL)
# =================================================================
class ProductionConfig(Config):
    DEBUG = False
    # Railway fournit automatiquement DATABASE_URL
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://user:password@localhost:5432/dbname'
    CORS_ORIGINS = [
        "https://tradesense-ia-production.up.railway.app",
        "https://tradesense-ia-143h.vercel.app",  # Ton frontend Vercel
    ]


# =================================================================
# Dictionnaire pour sélectionner la configuration
# =================================================================
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


# =================================================================
# Fonction pour récupérer la config active selon l'environnement
# =================================================================
def get_config(env=None):
    env = env or os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
