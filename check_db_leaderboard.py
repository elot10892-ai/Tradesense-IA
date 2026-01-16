from app import db, create_app
from app.models import Trade, User, Challenge
from datetime import datetime

app = create_app()
with app.app_context():
    closed_trades_count = Trade.query.filter_by(is_closed=True).count()
    total_trades_count = Trade.query.count()
    
    # Get current month range
    now = datetime.utcnow()
    start_date = datetime(now.year, now.month, 1)
    
    monthly_closed_trades = Trade.query.filter(Trade.is_closed == True, Trade.timestamp >= start_date).all()
    
    print(f"Total trades: {total_trades_count}")
    print(f"Closed trades: {closed_trades_count}")
    print(f"Closed trades this month (since {start_date}): {len(monthly_closed_trades)}")
    
    if len(monthly_closed_trades) > 0:
        for t in monthly_closed_trades[:5]:
            print(f"Trade ID: {t.id}, P&L: {t.profit_loss}, Date: {t.timestamp}")
    else:
        # Check some timestamps of recent closed trades
        recent_closed = Trade.query.filter_by(is_closed=True).order_by(Trade.timestamp.desc()).limit(5).all()
        print("\nRecent closed trades:")
        for t in recent_closed:
            print(f"Date: {t.timestamp}, P&L: {t.profit_loss}")

    # Check challenges
    challenges_count = Challenge.query.count()
    print(f"\nTotal challenges: {challenges_count}")
