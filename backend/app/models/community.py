from app import db
from datetime import datetime
import uuid

class CommunityPost(db.Model):
    """
    Modèle représentant une publication d'un utilisateur dans la zone communautaire
    """
    __tablename__ = 'community_posts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relations
    likes = db.relationship('CommunityLike', backref='post', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, current_user_id=None):
        """Convertir en dictionnaire pour JSON"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else "Trader",
            'role': self.user.role if self.user else "user",
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'likes_count': len(self.likes),
            'is_liked': any(like.user_id == current_user_id for like in self.likes) if current_user_id else False
        }

class CommunityLike(db.Model):
    """
    Modèle représentant un like sur une publication
    """
    __tablename__ = 'community_likes'
    __table_args__ = (
        db.UniqueConstraint('post_id', 'user_id', name='unique_user_post_like'),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = db.Column(db.String(36), db.ForeignKey('community_posts.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
