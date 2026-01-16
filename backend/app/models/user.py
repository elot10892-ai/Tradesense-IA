from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid


class User(db.Model):
    """
    Modèle représentant un utilisateur de la plateforme TradeSense
    """
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')  # user, admin, superadmin
    country = db.Column(db.String(100), nullable=True) # Added to match schema
    balance = db.Column(db.Float, default=0.0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relations
    challenges = db.relationship('Challenge', backref='user', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='user', lazy=True, cascade='all, delete-orphan')
    trading_accounts = db.relationship('TradingAccount', backref='user', lazy=True)
    trades = db.relationship('Trade', backref='user', lazy=True)
    posts = db.relationship('CommunityPost', backref='user', lazy=True)

    def set_password(self, password):
        """Hacher et définir le mot de passe de l'utilisateur"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Vérifier si le mot de passe fourni correspond au mot de passe haché"""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Convertir l'objet utilisateur en dictionnaire pour la sérialisation JSON"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'balance': self.balance,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active
        }

    def __repr__(self):
        return f'<User {self.username}>'