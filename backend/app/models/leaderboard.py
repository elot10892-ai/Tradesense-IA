from app import db
from datetime import datetime
import uuid


class Leaderboard(db.Model):
    """
    Modèle représentant le classement des utilisateurs par mois
    """
    __tablename__ = 'leaderboards'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    username = db.Column(db.String(80), nullable=False)
    profit_percentage = db.Column(db.Float, default=0.0, nullable=False)
    rank = db.Column(db.Integer, nullable=False)
    month = db.Column(db.String(7), nullable=False)  # Format: 'YYYY-MM'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    user = db.relationship('User', backref='leaderboard_entries', lazy=True)

    def to_dict(self):
        """Convertir l'objet leaderboard en dictionnaire pour la sérialisation JSON"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'profit_percentage': self.profit_percentage,
            'rank': self.rank,
            'month': self.month,
            'created_at': self.created_at.isoformat()
        }

    @classmethod
    def get_monthly_leaderboard(cls, year, month):
        """
        Obtenir le classement pour un mois spécifique
        Args:
            year (int): Année
            month (int): Mois (1-12)
        Returns:
            list: Liste des entrées du classement triées par rang
        """
        month_str = f"{year}-{month:02d}"
        return cls.query.filter_by(month=month_str).order_by(cls.rank).all()

    @classmethod
    def get_user_rank(cls, user_id, year, month):
        """
        Obtenir le rang d'un utilisateur spécifique pour un mois donné
        Args:
            user_id (str): ID de l'utilisateur
            year (int): Année
            month (int): Mois (1-12)
        Returns:
            int or None: Rang de l'utilisateur ou None s'il n'est pas dans le classement
        """
        month_str = f"{year}-{month:02d}"
        entry = cls.query.filter_by(user_id=user_id, month=month_str).first()
        return entry.rank if entry else None

    @classmethod
    def update_user_rank(cls, user_id, username, profit_percentage, year, month):
        """
        Mettre à jour le classement pour un utilisateur spécifique
        Args:
            user_id (str): ID de l'utilisateur
            username (str): Nom d'utilisateur
            profit_percentage (float): Pourcentage de profit
            year (int): Année
            month (int): Mois (1-12)
        """
        month_str = f"{year}-{month:02d}"
        
        # Vérifier si une entrée existe déjà pour ce mois
        entry = cls.query.filter_by(user_id=user_id, month=month_str).first()
        
        if entry:
            # Mettre à jour l'entrée existante
            entry.username = username
            entry.profit_percentage = profit_percentage
        else:
            # Créer une nouvelle entrée
            entry = cls(
                user_id=user_id,
                username=username,
                profit_percentage=profit_percentage,
                rank=0,  # Le rang sera calculé plus tard
                month=month_str
            )
            db.session.add(entry)
        
        # Réorganiser le classement pour ce mois
        cls.recalculate_monthly_rankings(year, month)

    @classmethod
    def recalculate_monthly_rankings(cls, year, month):
        """
        Recalculer les rangs pour un mois spécifique
        Args:
            year (int): Année
            month (int): Mois (1-12)
        """
        month_str = f"{year}-{month:02d}"
        
        # Récupérer toutes les entrées pour ce mois triées par profit_percentage décroissant
        entries = cls.query.filter_by(month=month_str).order_by(
            cls.profit_percentage.desc()
        ).all()
        
        # Mettre à jour les rangs
        for i, entry in enumerate(entries, start=1):
            entry.rank = i
        
        db.session.commit()

    def __repr__(self):
        return f'<Leaderboard {self.rank} for {self.username} in {self.month}>'