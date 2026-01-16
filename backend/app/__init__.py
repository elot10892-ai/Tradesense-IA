from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import config

# Initialiser les extensions Flask
db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name=None):
    """
    Créer et configurer l'instance de l'application Flask
    Utilise le pattern factory pour permettre différentes configurations
    """
    if config_name is None:
        config_name = 'default'
    
    app = Flask(__name__)
    
    # Charger la configuration appropriée
    app.config.from_object(config[config_name])
    
    # Initialiser les extensions avec l'application
    db.init_app(app)
    jwt.init_app(app)
    
    # Configurer CORS pour autoriser les requêtes du frontend
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Importer les blueprints depuis les fichiers de routes
    from app.routes.auth_routes import auth_bp
    from app.routes.trading_routes import trading_bp
    from app.routes.user_routes import user_bp
    from app.routes.payment_routes import payment_bp
    from app.routes.leaderboard_routes import leaderboard_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.price_routes import price_bp
    from app.routes.news_routes import news_bp
    from app.routes.community_routes import community_bp
    from app.routes.masterclass_routes import masterclass_bp
    
    # Enregistrer les blueprints dans l'application
    app.register_blueprint(auth_bp)
    app.register_blueprint(trading_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(leaderboard_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(price_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(community_bp)
    app.register_blueprint(masterclass_bp)
    
    # Créer les tables de la base de données si elles n'existent pas
    with app.app_context():
        db.create_all()
    
    return app