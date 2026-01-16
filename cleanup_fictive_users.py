from app import create_app, db
from app.models import User, Trade, Challenge

app = create_app()
with app.app_context():
    # List of names mentioned by user as fictive
    fictive_names = [
        "SarahTrades", "KarimFX", "JohnDoe_99", "CryptoWhale", 
        "AtlasLion", "EuroSniper", "ZenTrader", "ScalperPro", 
        "NomadInvest", "FutureKing", "AlphaWolf", "ForexMaster"
    ]
    
    users = User.query.filter(User.username.in_(fictive_names)).all()
    if users:
        print(f"Found {len(users)} fictive users. Deleting them and their data...")
        for user in users:
            # Cascades should handle challenges and trades if set up correctly
            db.session.delete(user)
        db.session.commit()
        print("Fictive users deleted.")
    else:
        print("No fictive users found in database.")
