import sqlite3
import os

# Check both possible locations
db_paths = [
    os.path.join('backend', 'instance', 'trading_platform_dev.db'),
    os.path.join('backend', 'trading_platform_dev.db')
]

def migrate():
    for db_path in db_paths:
        if not os.path.exists(db_path):
            print(f"Skipping {db_path}, file not found.")
            continue
            
        print(f"Connecting to {db_path}...")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='challenges'")
        if not cursor.fetchone():
            print(f"Skipping {db_path}, table 'challenges' not found.")
            conn.close()
            continue

        try:
            print(f"Adding failed_reason column to {db_path}...")
            cursor.execute("ALTER TABLE challenges ADD COLUMN failed_reason TEXT")
        except sqlite3.OperationalError as e:
            print(f"failed_reason column might already exist: {e}")

        try:
            print(f"Adding completed_at column to {db_path}...")
            cursor.execute("ALTER TABLE challenges ADD COLUMN completed_at TEXT")
        except sqlite3.OperationalError as e:
            print(f"completed_at column might already exist: {e}")

        conn.commit()
        conn.close()
        print(f"Migration for {db_path} completed.")

if __name__ == "__main__":
    migrate()
