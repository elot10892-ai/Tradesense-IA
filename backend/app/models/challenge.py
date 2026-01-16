from app import db
from datetime import datetime, timedelta
from enum import Enum
import uuid


class PlanType(Enum):
    STARTER = "starter"
    PRO = "pro"
    ELITE = "elite"


class ChallengeStatus(Enum):
    ACTIVE = "active"
    PASSED = "passed"
    FAILED = "failed"


class PaymentStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(Enum):
    CMI = "CMI"
    CRYPTO = "Crypto"
    PAYPAL = "PayPal"


class Challenge(db.Model):
    """
    Modèle représentant un défi de trading pour un utilisateur
    """
    __tablename__ = 'challenges'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    plan_type = db.Column(db.String(20), default=PlanType.STARTER.value, nullable=False)
    initial_balance = db.Column(db.Float, nullable=False)
    current_balance = db.Column(db.Float, default=0.0, nullable=False)
    status = db.Column(db.String(20), default=ChallengeStatus.ACTIVE.value, nullable=False)
    max_daily_loss_pct = db.Column(db.Float, default=5.0)  # 5% de perte maximale par jour
    max_total_loss_pct = db.Column(db.Float, default=10.0)  # 10% de perte maximale totale
    profit_target_pct = db.Column(db.Float, default=10.0)  # 10% de profit cible
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    payment_status = db.Column(db.String(20), default=PaymentStatus.PENDING.value)
    payment_method = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    failed_reason = db.Column(db.String(50))  # 'daily_loss' / 'total_loss'
    completed_at = db.Column(db.DateTime)
    
    daily_start_balance = db.Column(db.Float, default=0.0)
    last_reset_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    trades = db.relationship('TsTrade', backref='challenge', lazy=True, cascade='all, delete-orphan')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.start_date:
            self.start_date = datetime.utcnow()
            
        # Calculer la date de fin basée sur la date de début
        if not self.end_date:
            # Par défaut, un défi dure 30 jours
            self.end_date = self.start_date + timedelta(days=30)
        
        if not self.daily_start_balance and self.initial_balance:
            self.daily_start_balance = self.initial_balance

    def to_dict(self):
        """Convertir l'objet challenge en dictionnaire pour la sérialisation JSON"""
        self.check_and_reset_daily_balance()
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_type': self.plan_type,
            'initial_balance': self.initial_balance,
            'current_balance': self.current_balance,
            'daily_start_balance': self.daily_start_balance,
            'status': self.status,
            'max_daily_loss_pct': self.max_daily_loss_pct,
            'max_total_loss_pct': self.max_total_loss_pct,
            'profit_target_pct': self.profit_target_pct,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'failed_reason': self.failed_reason,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'last_reset_date': self.last_reset_date.isoformat() if self.last_reset_date else None
        }

    def check_and_reset_daily_balance(self):
        """Réinitialiser le solde de départ quotidien si on change de jour"""
        now = datetime.utcnow()
        if not self.last_reset_date or self.last_reset_date.date() < now.date():
            self.daily_start_balance = self.current_balance
            self.last_reset_date = now
            return True
        return False

    def calculate_profit_percentage(self):
        """Calculer le pourcentage de profit par rapport au solde initial"""
        if self.initial_balance == 0:
            return 0.0
        return ((self.current_balance - self.initial_balance) / self.initial_balance) * 100

    def check_profit_target(self):
        """Vérifier si l'objectif de profit est atteint (10%)"""
        return self.calculate_profit_percentage() >= self.profit_target_pct

    def check_daily_loss_limit(self, current_equity=None):
        """Vérifier si la perte quotidienne dépasse la limite (5%)"""
        if not self.daily_start_balance or self.daily_start_balance == 0:
            self.daily_start_balance = self.initial_balance
            
        value_to_check = current_equity if current_equity is not None else self.current_balance
        loss_percentage = ((self.daily_start_balance - value_to_check) / self.daily_start_balance) * 100
        return loss_percentage >= self.max_daily_loss_pct

    def check_total_loss_limit(self, current_equity=None):
        """Vérifier si la perte totale dépasse la limite (10%)"""
        if self.initial_balance == 0:
            return False
        value_to_check = current_equity if current_equity is not None else self.current_balance
        loss_percentage = ((self.initial_balance - value_to_check) / self.initial_balance) * 100
        return loss_percentage >= self.max_total_loss_pct

    def is_passed(self, current_equity=None):
        """Vérifier si le défi est réussi (Profit Target 10%)"""
        # Pour réussir, on vérifie généralement le solde (balance) ou l'équité. 
        # Ici on va rester sur l'équité pour être cohérent.
        value_to_check = current_equity if current_equity is not None else self.current_balance
        profit_pct = ((value_to_check - self.initial_balance) / self.initial_balance) * 100 if self.initial_balance != 0 else 0
        return profit_pct >= self.profit_target_pct

    def is_failed(self, current_equity=None):
        """Vérifier si le défi est échoué"""
        return self.check_total_loss_limit(current_equity) or self.check_daily_loss_limit(current_equity)

    def update_status(self, current_equity=None):
        """Mettre à jour le statut du défi en fonction des règles"""
        if self.status != ChallengeStatus.ACTIVE.value:
            return

        # On utilise l'équité si fournie, sinon le solde actuel
        value_to_check = current_equity if current_equity is not None else self.current_balance
        
        # Vérifier d'abord les conditions d'échec
        if self.check_total_loss_limit(value_to_check):
            self.status = ChallengeStatus.FAILED.value
            self.failed_reason = 'total_loss'
            self.completed_at = datetime.utcnow()
        elif self.check_daily_loss_limit(value_to_check):
            self.status = ChallengeStatus.FAILED.value
            self.failed_reason = 'daily_loss'
            self.completed_at = datetime.utcnow()
        # Ensuite vérifier la condition de réussite
        elif self.is_passed(value_to_check):
            self.status = ChallengeStatus.PASSED.value
            self.completed_at = datetime.utcnow()

    def get_remaining_days(self):
        """Obtenir le nombre de jours restants pour le défi"""
        today = datetime.utcnow().date()
        end_date = self.end_date.date()
        remaining = (end_date - today).days
        return max(0, remaining)

    def __repr__(self):
        return f'<Challenge {self.plan_type} for User {self.user_id}>'
