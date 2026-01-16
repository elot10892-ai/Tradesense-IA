from app import create_app, db
from app.models import User, Challenge, Trade
from app.models.challenge import PlanType, ChallengeStatus
from datetime import datetime, timedelta
import random
import uuid

app = create_app()

def seed_leaderboard():
    with app.app_context():
        print("--- SEEDING LEADERBOARD DATA ---")
        
        # 1. Create realistic profiles
        profiles = [
            ("SarahTrades", "Maroc"),
            ("KarimFX", "France"),
            ("JohnDoe_99", "USA"),
            ("CryptoWhale", "UAE"),
            ("AtlasLion", "Maroc"),
            ("EuroSniper", "Germany"),
            ("ZenTrader", "Japan"),
            ("ScalperPro", "UK"),
            ("NomadInvest", "Spain"),
            ("FutureKing", "Canada"),
            ("AlphaWolf", "Italy"),
            ("ForexMaster", "Brazil")
        ]
        
        seeded_count = 0
        now = datetime.utcnow()
        
        for username, country in profiles:
            # Check if user exists
            user = User.query.filter_by(username=username).first()
            if not user:
                user = User(
                    username=username, 
                    email=f"{username.lower()}@example.com", 
                    country=country,
                    password_hash="mock_hash" # Not needed for leaderboard display
                )
                db.session.add(user)
                db.session.flush() # get ID
                print(f"Created user {username}")
            
            # Check if active challenge exists
            challenge = Challenge.query.filter_by(user_id=user.id).first()
            if not challenge:
                challenge = Challenge(
                    user_id=user.id,
                    plan_type=PlanType.PRO.value,
                    initial_balance=10000.0,
                    current_balance=10000.0,
                    status=ChallengeStatus.ACTIVE.value,
                    start_date=now - timedelta(days=15)
                )
                db.session.add(challenge)
                db.session.flush()
                print(f"Created challenge for {username}")
                
            # Create trades if none exist for this month
            # We want specific profits to order them nicely
            # Let's assign a random profit % target roughly
            target_profit = random.uniform(-5, 20) # -5% to +20%
            
            # Clean existing trades for clean slate? No, just add new ones if none.
            # actually let's ensure they have activity this month
            
            trade = Trade(
                challenge_id=challenge.id,
                user_id=user.id,
                symbol="EURUSD",
                trade_type="BUY",
                quantity=1,
                entry_price=1.1000,
                exit_price=1.1000 * (1 + (target_profit/1000.0)), # simplistic math
                profit_loss= challenge.initial_balance * (target_profit / 100),
                timestamp=now - timedelta(days=random.randint(1, 10)),
                is_closed=True
            )
            # Update challenge balance
            challenge.current_balance += trade.profit_loss
            
            db.session.add(trade)
            seeded_count += 1
            
        db.session.commit()
        print(f"Successfully seeded {seeded_count} trades for leaderboard.")

if __name__ == "__main__":
    seed_leaderboard()
