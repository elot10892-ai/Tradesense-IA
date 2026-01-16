from app import db
from datetime import datetime
import uuid

class MasterClass(db.Model):
    """
    Modèle représentant une MasterClass (cours vidéo) sur la plateforme TradeSense
    """
    __tablename__ = 'masterclasses'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    level = db.Column(db.String(50), nullable=False)  # 'Débutant', 'Intermédiaire', 'Avancé'
    category = db.Column(db.String(50), nullable=False) # 'Tous', 'Trading', 'Psychologie', etc.
    duration = db.Column(db.String(50), nullable=False) # e.g., "45 min"
    video_url = db.Column(db.String(500), nullable=True)
    video_type = db.Column(db.String(50), default='placeholder') # 'embed', 'placeholder'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convertir en dictionnaire pour JSON"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'level': self.level,
            'category': self.category,
            'duration': self.duration,
            'video_url': self.video_url,
            'video_type': self.video_type,
            'created_at': self.created_at.isoformat()
        }
