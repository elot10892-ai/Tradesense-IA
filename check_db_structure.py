from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    # Check tables
    result = db.session.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
    tables = [row[0] for row in result]
    print(f"Tables: {tables}")
    
    # Check indexes
    result = db.session.execute(text("SELECT name FROM sqlite_master WHERE type='index';"))
    indexes = [row[0] for row in result]
    print(f"Indexes: {indexes}")
    
    # Check table structure for ts_trades
    if 'ts_trades' in tables:
        result = db.session.execute(text("PRAGMA table_info(ts_trades);"))
        print("\nStructure of ts_trades:")
        for row in result:
            print(row)
    elif 'trades' in tables:
        result = db.session.execute(text("PRAGMA table_info(trades);"))
        print("\nStructure of trades:")
        for row in result:
            print(row)
