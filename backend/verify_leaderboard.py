from app import create_app, db
from app.models import User, Challenge, Trade
from sqlalchemy import func
from datetime import datetime

app = create_app()
with app.app_context():
    print(f"DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
    
    # 1. Raw counts
    user_count = User.query.count()
    chal_count = Challenge.query.count()
    trade_count = Trade.query.count()
    closed_trade_count = Trade.query.filter(Trade.is_closed == True).count()
    
    print(f"Users: {user_count}, Challenges: {chal_count}, Trades: {trade_count}, ClosedTrades: {closed_trade_count}")

    # 2. Date filtering
    now = datetime.utcnow()
    start_date = datetime(now.year, now.month, 1)
    if now.month == 12:
        end_date = datetime(now.year + 1, 1, 1)
    else:
        end_date = datetime(now.year, now.month + 1, 1)

    print(f"Filtering trades from {start_date} to {end_date}")

    in_month_count = Trade.query.filter(Trade.timestamp >= start_date, Trade.timestamp < end_date).count()
    print(f"Trades in month: {in_month_count}")

    # 3. Join validity
    # Find active traders (trades that map to challenge and user)
    valid_trades = db.session.query(Trade.id).join(Challenge, Trade.challenge_id == Challenge.id).join(User, Challenge.user_id == User.id).filter(Trade.is_closed == True, Trade.timestamp >= start_date, Trade.timestamp < end_date).count()
    print(f"Trades passing all filters & joins: {valid_trades}")

    # 4. Resulting leaderboard
    leaderboard_data = db.session.query(
        User.username,
        func.sum(Trade.profit_loss).label('total_profit')
    ).select_from(Trade)\
        .join(Challenge, Trade.challenge_id == Challenge.id)\
        .join(User, Challenge.user_id == User.id)\
        .filter(Trade.is_closed == True)\
        .filter(Trade.timestamp >= start_date)\
        .filter(Trade.timestamp < end_date)\
        .group_by(User.id)\
        .all()

    print(f"Leaderboard entries: {len(leaderboard_data)}")
    for t in leaderboard_data:
        print(f" - {t.username}: {t.total_profit}")
