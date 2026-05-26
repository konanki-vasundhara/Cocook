import os
import sys
import datetime
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database import SessionLocal
import models

db = SessionLocal()
try:
    print("Trying to add a test story...")
    new_story = models.Story(
        user_id=1,
        content="Test story content",
        image_url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        file_type="image",
        filter_style="none"
    )
    db.add(new_story)
    db.commit()
    db.refresh(new_story)
    print(f"Successfully added story! ID: {new_story.id}")
    print(f"Story user: {new_story.user.name if new_story.user else None}")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
