from app import db
from datetime import datetime
import uuid


class TsTrade(db.Model):
    """
    Modèle représentant une transaction de trading dans un défi
    """
    __tablename__ = 'ts_trades'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = db.Column(db.String(36), db.ForeignKey('challenges.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True) # Optional link for history
    symbol = db.Column(db.String(10), nullable=False)  # Symbole de l'actif (ex: AAPL, EURUSD)
    trade_type = db.Column(db.String(10), nullable=False)  # BUY, SELL
    quantity = db.Column(db.Integer, nullable=False)
    entry_price = db.Column(db.Float, nullable=False)
    exit_price = db.Column(db.Float, nullable=True)  # Prix de sortie, null si position ouverte
    profit_loss = db.Column(db.Float, default=0.0)  # Profit/Loss
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_closed = db.Column(db.Boolean, default=False)
    
    # Relations
    # Note: user relation is available through challenge.user

    def to_dict(self, current_price=None):
        """Convertir l'objet trade en dictionnaire pour la sérialisation JSON"""
        data = {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'user_id': self.user_id,
            'symbol': self.symbol,
            'trade_type': self.trade_type,
            'quantity': self.quantity,
            'entry_price': self.entry_price,
            'exit_price': self.exit_price,
            'profit_loss': self.profit_loss,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_closed': self.is_closed
        }
        
        if not self.is_closed and current_price is not None:
            data['unrealized_pnl'] = self.calculate_unrealized_pnl(current_price)
            data['current_price'] = current_price
        elif self.is_closed:
            data['unrealized_pnl'] = self.profit_loss
            data['current_price'] = self.exit_price
            
        return data

    def calculate_unrealized_pnl(self, current_price):
        """Calculer le P&L non réalisé basé sur le prix actuel"""
        if current_price is None:
            return 0.0
            
        if self.trade_type.upper() == 'BUY':
            return (current_price - self.entry_price) * self.quantity
        elif self.trade_type.upper() == 'SELL':
            return (self.entry_price - current_price) * self.quantity
        return 0.0

    def calculate_profit_loss(self):
        """Calculer le profit/loss de la transaction"""
        if self.is_closed and self.exit_price is not None:
            if self.trade_type.upper() == 'BUY':
                self.profit_loss = (self.exit_price - self.entry_price) * self.quantity
            elif self.trade_type.upper() == 'SELL':
                self.profit_loss = (self.entry_price - self.exit_price) * self.quantity
        return self.profit_loss

    def close_trade(self, exit_price, challenge):
        """Clôturer la transaction avec un prix de sortie et mettre à jour le challenge"""
        self.exit_price = exit_price
        self.is_closed = True
        self.profit_loss = self.calculate_profit_loss()
        
        # Mettre à jour le solde du challenge avec le profit/perte de la transaction
        challenge.current_balance += self.profit_loss
        
        # Mettre à jour le statut du challenge en fonction des règles
        challenge.update_status()
        
        return self.profit_loss

    def get_trade_duration(self):
        """Obtenir la durée de la transaction en secondes"""
        # Since we only have one timestamp field, we calculate from trade creation to now
        # In a real application, you'd have separate entry_time and exit_time fields
        return (datetime.utcnow() - self.timestamp).total_seconds()

    def is_profitable(self):
        """Vérifier si la transaction est profitable"""
        return self.profit_loss > 0

    def risk_reward_ratio(self):
        """Calculer le ratio risque/rendement de la transaction"""
        if self.exit_price is not None:
            if self.trade_type.upper() == 'BUY':
                entry_exit_diff = abs(self.exit_price - self.entry_price)
                risk = abs(self.entry_price - min(self.exit_price, self.entry_price))
            else:  # SELL
                entry_exit_diff = abs(self.entry_price - self.exit_price)
                risk = abs(self.entry_price - max(self.exit_price, self.entry_price))
            
            if risk == 0:
                return float('inf') if entry_exit_diff > 0 else 0
            return entry_exit_diff / risk
        return 0

    def __repr__(self):
        return f'<TsTrade {self.symbol} {self.trade_type} {self.quantity} on Challenge {self.challenge_id}>'