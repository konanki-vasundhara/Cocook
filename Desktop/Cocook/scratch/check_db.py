import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database import SessionLocal
import models

db = SessionLocal()
try:
    print("--- USERS ---")
    users = db.query(models.User).all()
    for u in users:
        print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}")
        
    print("\n--- STORIES ---")
    stories = db.query(models.Story).all()
    for s in stories:
        print(f"ID: {s.id}, User ID: {s.user_id}, Content: {s.content[:30] if s.content else None}, Has Image: {bool(s.image_url)}")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
