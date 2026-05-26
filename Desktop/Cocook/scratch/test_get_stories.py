import os
import sys
import datetime
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database import SessionLocal
import models

db = SessionLocal()
try:
    print("Testing fetch of active stories...")
    cutoff_time = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    print("Cutoff time:", cutoff_time)
    
    stories = db.query(models.Story).all()
    for s in stories:
        print(f"Story {s.id}: created_at={s.created_at}")
        
    active_stories = db.query(models.Story).filter(
        models.Story.user_id.in_([1]),
        models.Story.created_at >= cutoff_time
    ).all()
    
    print("Active stories found:", len(active_stories))
except Exception as e:
    print("Error:", e)
finally:
    db.close()
