from app import db
from datetime import datetime
import uuid


class Trade(db.Model):
    """
    Modèle représentant une transaction de trading
    """
    __tablename__ = 'trades'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    trade_type = db.Column(db.String(10), nullable=False)  # buy, sell
    symbol = db.Column(db.String(10), nullable=False)  # Symbole de l'actif (ex: AAPL, EURUSD)
    quantity = db.Column(db.Integer, nullable=False)
    entry_price = db.Column(db.Float, nullable=False)
    exit_price = db.Column(db.Float, nullable=True)  # Prix de sortie, null si position ouverte
    entry_time = db.Column(db.DateTime, default=datetime.utcnow)
    exit_time = db.Column(db.DateTime, nullable=True)  # Heure de clôture, null si position ouverte
    pnl = db.Column(db.Float, default=0.0)  # Profit/Loss
    status = db.Column(db.String(20), default='open')  # open, closed, pending
    stop_loss = db.Column(db.Float, nullable=True)
    take_profit = db.Column(db.Float, nullable=True)
    
    # Clés étrangères
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    trading_account_id = db.Column(db.String(36), db.ForeignKey('trading_accounts.id'), nullable=False)
    asset_id = db.Column(db.String(36), db.ForeignKey('assets.id'), nullable=True)

    def to_dict(self):
        """Convertir l'objet trade en dictionnaire pour la sérialisation JSON"""
        return {
            'id': self.id,
            'trade_type': self.trade_type,
            'symbol': self.symbol,
            'quantity': self.quantity,
            'entry_price': self.entry_price,
            'exit_price': self.exit_price,
            'entry_time': self.entry_time.isoformat() if self.entry_time else None,
            'exit_time': self.exit_time.isoformat() if self.exit_time else None,
            'pnl': self.pnl,
            'status': self.status,
            'stop_loss': self.stop_loss,
            'take_profit': self.take_profit,
            'user_id': self.user_id,
            'trading_account_id': self.trading_account_id,
            'asset_id': self.asset_id
        }

    def calculate_pnl(self):
        """Calculer le profit/loss de la transaction"""
        if self.status == 'closed' and self.exit_price is not None:
            if self.trade_type == 'buy':
                self.pnl = (self.exit_price - self.entry_price) * self.quantity
            elif self.trade_type == 'sell':
                self.pnl = (self.entry_price - self.exit_price) * self.quantity
        return self.pnl

    def __repr__(self):
        return f'<Trade {self.symbol} {self.trade_type} {self.quantity}>'