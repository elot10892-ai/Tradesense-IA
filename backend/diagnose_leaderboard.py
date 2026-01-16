from app import create_app, db
from app.models import User, Challenge, Trade
from datetime import datetime

app = create_app()
with app.app_context():
    print("--- DIAGNOSTIC LEADERBOARD ---")
    users = User.query.all()
    print(f"1. Utilisateurs total: {len(users)}")
    
    trades = Trade.query.all()
    print(f"2. Trades total: {len(trades)}")
    
    now = datetime.utcnow()
    start_date = datetime(now.year, now.month, 1)
    if now.month == 12:
        end_date = datetime(now.year + 1, 1, 1)
    else:
        end_date = datetime(now.year, now.month + 1, 1)
        
    print(f"   Date du mois: {start_date} à {end_date}")
    
    trades_in_month = Trade.query.filter(Trade.timestamp >= start_date, Trade.timestamp < end_date).all()
    print(f"3. Trades ce mois-ci: {len(trades_in_month)}")
    
    closed_trades = [t for t in trades_in_month if t.is_closed]
    print(f"4. Trades CLÔTURÉS ce mois-ci: {len(closed_trades)}")
    
    # Check logical links
    valid_count = 0
    for t in closed_trades:
        chal = Challenge.query.get(t.challenge_id)
        if not chal:
            print(f"   [!] Trade {t.id} a un challenge_id invalide: {t.challenge_id}")
            continue
        user = User.query.get(chal.user_id)
        if not user:
            print(f"   [!] Challenge {chal.id} a un user_id invalide: {chal.user_id}")
            continue
        valid_count += 1
        
    print(f"5. Trades valides (Liés à Challenge & User): {valid_count}")
    
    if valid_count == 0:
        print("\nCONCLUSION: Le leaderboard est vide car aucun trade n'est CLÔTURÉ et VALIDE pour ce mois-ci.")
    else:
        print(f"\nCONCLUSION: Il devrait y avoir des données. Vérifiez le frontend.")
