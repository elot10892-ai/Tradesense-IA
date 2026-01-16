import sqlite3
import os

db_path = 'instance/trading_platform_dev.db'
if not os.path.exists(db_path):
    db_path = 'trading_platform_dev.db'
    
print(f"Checking DB at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    print("Columns in users table:")
    found_country = False
    for col in columns:
        print(f" - {col[1]}")
        if col[1] == 'country':
            found_country = True
            
    if not found_country and len(columns) > 0:
        print("MISSING country column!")
        print("Adding country column...")
        cursor.execute("ALTER TABLE users ADD COLUMN country TEXT")
        conn.commit()
        print("Column added.")
    elif len(columns) == 0:
        print("Table 'users' NOT FOUND.")
    else:
        print("Country column exists.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
