import sqlite3

conn = sqlite3.connect('backend/cocook.db')
cursor = conn.cursor()

# Get users
cursor.execute("SELECT id, name, email FROM users;")
print("Users:")
for row in cursor.fetchall():
    print(row)

# Get friendships
cursor.execute("SELECT * FROM friendships;")
print("\nFriendships:")
for row in cursor.fetchall():
    print(row)

# Get stories
cursor.execute("SELECT * FROM stories;")
print("\nStories:")
for row in cursor.fetchall():
    print(row)

conn.close()
