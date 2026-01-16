from app import create_app, db
from app.models.masterclass import MasterClass

def seed_masterclasses():
    app = create_app()
    with app.app_context():
        # Nettoyage des anciennes données
        db.session.query(MasterClass).delete()
        
        masterclasses = [
            {
                "title": "Introduction au Prop Trading",
                "description": "Comprenez le modèle économique des Prop Firms, les règles d'évaluation TradeSense AI et comment obtenir votre premier compte capitalisé.",
                "level": "Débutant",
                "category": "Prop Firm",
                "duration": "15 min",
                "video_type": "local",
                "video_url": "/masterclass_videos/prop_trading_intro.mp4"
            },
            {
                "title": "Gestion du Risque & Drawdown",
                "description": "Apprenez à respecter strictement les limites de perte quotidienne et totale. Maîtrisez la taille de position pour ne jamais échouer votre challenge.",
                "level": "Débutant",
                "category": "Risk Management",
                "duration": "20 min",
                "video_type": "local",
                "video_url": "/masterclass_videos/risk_management.mp4"
            },
            {
                "title": "Psychologie du Trader Pro",
                "description": "Gérez le stress d'un gros capital. Apprenez la discipline nécessaire pour trader selon un plan rigoureux sans émotions.",
                "level": "Intermédiaire",
                "category": "Psychologie",
                "duration": "18 min",
                "video_type": "local",
                "video_url": "/masterclass_videos/trading_psychology.mp4"
            },
            {
                "title": "Analyse Technique Fondamentale",
                "description": "Maîtrisez les supports, résistances et lignes de tendance. Apprenez à identifier les structures de marché à haute probabilité.",
                "level": "Intermédiaire",
                "category": "Trading",
                "duration": "25 min",
                "video_type": "local",
                "video_url": "/masterclass_videos/technical_analysis.mp4"
            },
            {
                "title": "Stratégie de Scalping MASI",
                "description": "Exécution ultra-rapide sur les actifs volatils. Apprenez à capturer des profits rapides en quelques minutes avec précision.",
                "level": "Avancé",
                "category": "Trading",
                "duration": "30 min",
                "video_type": "local",
                "video_url": "/masterclass_videos/scalping_strategy.mp4"
            }
        ]

        for mc in masterclasses:
            new_mc = MasterClass(
                title=mc['title'],
                description=mc['description'],
                level=mc['level'],
                category=mc['category'],
                duration=mc['duration'],
                video_url=mc['video_url'],
                video_type=mc['video_type']
            )
            db.session.add(new_mc)
        
        db.session.commit()
        print(f"Catalogue MasterClass local mis à jour pour TradeSense AI (Examen).")

if __name__ == "__main__":
    seed_masterclasses()
