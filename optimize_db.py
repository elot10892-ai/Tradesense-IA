from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    # Check table names first
    result = db.session.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
    tables = [row[0] for row in result]
    print(f"Existing tables: {tables}")
    
    trade_table = 'ts_trades' if 'ts_trades' in tables else 'trades'
    print(f"Using trade table: {trade_table}")
    
    # Create indexes if they don't exist
    statements = [
        f"CREATE INDEX IF NOT EXISTS idx_challenge_user ON challenges(user_id);",
        f"CREATE INDEX IF NOT EXISTS idx_trade_challenge ON {trade_table}(challenge_id);",
        f"CREATE INDEX IF NOT EXISTS idx_trade_user ON {trade_table}(user_id);"
    ]
    
    for stmt in statements:
        try:
            db.session.execute(text(stmt))
            print(f"Executed: {stmt}")
        except Exception as e:
            print(f"Error executing {stmt}: {e}")
            
    db.session.commit()
    print("Optimization finished.")
