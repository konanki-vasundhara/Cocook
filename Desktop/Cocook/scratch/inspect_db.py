import sqlite3

conn = sqlite3.connect('backend/cocook.db')
cursor = conn.cursor()

# Get list of tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in database:")
for table in tables:
    table_name = table[0]
    print(f"\nTable: {table_name}")
    # Get columns
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  Column: {col[1]} ({col[2]})")

conn.close()
