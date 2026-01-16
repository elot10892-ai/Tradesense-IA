from app import db
from datetime import datetime
from enum import Enum
import uuid


class PaymentStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(Enum):
    CMI = "CMI"
    CRYPTO = "Crypto"
    PAYPAL = "PayPal"


class Payment(db.Model):
    """
    Modèle représentant un paiement effectué par un utilisateur
    """
    __tablename__ = 'payments'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='USD', nullable=False)
    method = db.Column(db.String(20), nullable=False)  # CMI, Crypto, PayPal
    status = db.Column(db.String(20), default=PaymentStatus.PENDING.value, nullable=False)
    transaction_id = db.Column(db.String(100), unique=True)  # ID de transaction externe
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.Text, nullable=True)
    
    # Relations
    # Note: user relation is available through user backref

    def to_dict(self):
        """Convertir l'objet payment en dictionnaire pour la sérialisation JSON"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'currency': self.currency,
            'method': self.method,
            'status': self.status,
            'transaction_id': self.transaction_id,
            'timestamp': self.timestamp.isoformat(),
            'description': self.description
        }

    def confirm_payment(self):
        """Confirmer le paiement comme complété"""
        self.status = PaymentStatus.COMPLETED.value
        self.timestamp = datetime.utcnow()
        db.session.commit()

    def fail_payment(self):
        """Marquer le paiement comme échoué"""
        self.status = PaymentStatus.FAILED.value
        self.timestamp = datetime.utcnow()
        db.session.commit()

    def refund_payment(self):
        """Rembourser le paiement"""
        if self.status == PaymentStatus.COMPLETED.value:
            self.status = PaymentStatus.REFUNDED.value
            self.timestamp = datetime.utcnow()
            db.session.commit()
            return True
        return False

    def is_successful(self):
        """Vérifier si le paiement a été effectué avec succès"""
        return self.status == PaymentStatus.COMPLETED.value

    def is_pending(self):
        """Vérifier si le paiement est en attente"""
        return self.status == PaymentStatus.PENDING.value

    def is_refunded(self):
        """Vérifier si le paiement a été remboursé"""
        return self.status == PaymentStatus.REFUNDED.value

    @classmethod
    def get_user_payments(cls, user_id):
        """
        Obtenir tous les paiements d'un utilisateur
        Args:
            user_id (str): ID de l'utilisateur
        Returns:
            list: Liste des paiements de l'utilisateur
        """
        return cls.query.filter_by(user_id=user_id).order_by(
            cls.timestamp.desc()
        ).all()

    @classmethod
    def get_recent_payments(cls, days=30):
        """
        Obtenir les paiements récents
        Args:
            days (int): Nombre de jours à considérer
        Returns:
            list: Liste des paiements récents
        """
        from datetime import timedelta
        since = datetime.utcnow() - timedelta(days=days)
        return cls.query.filter(cls.timestamp >= since).order_by(
            cls.timestamp.desc()
        ).all()

    def __repr__(self):
        return f'<Payment {self.method} {self.amount} {self.currency} for User {self.user_id}>'