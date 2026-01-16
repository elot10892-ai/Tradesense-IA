from app import db
from datetime import datetime
import uuid


class Asset(db.Model):
    """
    Modèle représentant un actif financier disponible pour le trading
    """
    __tablename__ = 'assets'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = db.Column(db.String(10), unique=True, nullable=False)  # Symbole de l'actif (ex: AAPL, EURUSD)
    name = db.Column(db.String(100), nullable=False)  # Nom complet de l'actif
    asset_type = db.Column(db.String(20), nullable=False)  # stock, forex, crypto, commodity
    exchange = db.Column(db.String(50), nullable=True)  # Bourse sur laquelle l'actif est coté
    currency = db.Column(db.String(10), default='USD')  # Devise de cotation
    min_lot_size = db.Column(db.Float, default=0.01)  # Taille minimale de lot
    max_leverage = db.Column(db.Float, default=1.0)  # Levier maximal autorisé
    spread = db.Column(db.Float, default=0.0)  # Spread moyen
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    trades = db.relationship('Trade', backref='asset', lazy=True)

    def to_dict(self):
        """Convertir l'objet asset en dictionnaire pour la sérialisation JSON"""
        return {
            'id': self.id,
            'symbol': self.symbol,
            'name': self.name,
            'asset_type': self.asset_type,
            'exchange': self.exchange,
            'currency': self.currency,
            'min_lot_size': self.min_lot_size,
            'max_leverage': self.max_leverage,
            'spread': self.spread,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<Asset {self.symbol}>'