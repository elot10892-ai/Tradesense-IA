from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import re
from config import config

# Extensions Flask
db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name=None):
    if config_name is None:
        config_name = 'default'

    app = Flask(__name__)

    # Charger la config
    app.config.from_object(config[config_name])

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)

    # Configure CORS
    allowed_origins = [
        "https://tradesense-ia.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        re.compile(r"^https://tradesense-.*-ch-elots-projects\.vercel\.app$")
    ]
    CORS(app, resources={r"/*": {"origins": allowed_origins}}, supports_credentials=True)








    # Blueprints
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
    from app.routes.ai_routes import ai_bp

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
    app.register_blueprint(ai_bp)

    # ✅ Route racine unique
    @app.route("/")
    def health():
        return {
            "status": "ok",
            "message": "TradeSense API online"
        }

    # Création DB
    with app.app_context():
        db.create_all()

    return app
