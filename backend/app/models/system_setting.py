from app import db
from datetime import datetime

class SystemSetting(db.Model):
    """
    Modèle pour stocker les configurations globales du système
    """
    __tablename__ = 'system_settings'

    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.Text, nullable=False)
    description = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @classmethod
    def get(cls, key, default=None):
        setting = cls.query.filter_by(key=key).first()
        return setting.value if setting else default

    @classmethod
    def set(cls, key, value, description=None):
        setting = cls.query.filter_by(key=key).first()
        if setting:
            setting.value = value
            if description:
                setting.description = description
        else:
            setting = cls(key=key, value=value, description=description)
            db.session.add(setting)
        db.session.commit()
        return setting

    def __repr__(self):
        return f'<SystemSetting {self.key}={self.value}>'
