import requests
import json
import os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
import auth

# Generate a valid token for user 1
token = auth.create_access_token({"sub": "1"})
print(f"Token: {token[:40]}...")

# 1. POST a new story
print("\n--- TEST 1: Create Story ---")
url = f"http://localhost:8000/api/stories?token={token}"
payload = {
    "content": "Testing story sharing fix!",
    "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    "file_type": "image",
    "filter_style": "none"
}
res = requests.post(url, json=payload)
print(f"Status: {res.status_code}")
if res.ok:
    data = res.json()
    print(f"Story created: ID={data['id']}, user={data['user']['name']}")
else:
    print(f"FAILED: {res.text}")

# 2. GET stories
print("\n--- TEST 2: Fetch Active Stories ---")
url = f"http://localhost:8000/api/stories?token={token}"
res = requests.get(url)
print(f"Status: {res.status_code}")
if res.ok:
    stories = res.json()
    print(f"Found {len(stories)} active stories:")
    for s in stories:
        has_user = 'user' in s and s['user'] is not None
        print(f"  ID={s['id']}, user_id={s['user_id']}, has_user={has_user}, content={s.get('content','')[:30]}")
else:
    print(f"FAILED: {res.text}")

print("\n✅ Story sharing flow test complete!")
