from app import db
from datetime import datetime
import uuid


class TradingAccount(db.Model):
    """
    Modèle représentant un compte de trading pour un utilisateur
    """
    __tablename__ = 'trading_accounts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_number = db.Column(db.String(20), unique=True, nullable=False)
    balance = db.Column(db.Float, default=0.0, nullable=False)
    equity = db.Column(db.Float, default=0.0, nullable=False)
    leverage = db.Column(db.Float, default=1.0, nullable=False)
    risk_level = db.Column(db.String(20), default='medium')  # low, medium, high
    status = db.Column(db.String(20), default='active')  # active, inactive, suspended
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Clé étrangère vers l'utilisateur propriétaire du compte
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Relations
    trades = db.relationship('Trade', backref='trading_account', lazy=True)

    def to_dict(self):
        """Convertir l'objet compte de trading en dictionnaire pour la sérialisation JSON"""
        return {
            'id': self.id,
            'account_number': self.account_number,
            'balance': self.balance,
            'equity': self.equity,
            'leverage': self.leverage,
            'risk_level': self.risk_level,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user_id': self.user_id
        }

    def __repr__(self):
        return f'<TradingAccount {self.account_number}>'