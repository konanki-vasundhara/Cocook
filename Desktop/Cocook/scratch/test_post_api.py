import requests
import json

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.test" # We need a valid token signature or valid mock token

# Let's decode or generate a valid token using auth module
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
import auth

# Generate token for user 1
access_token = auth.create_access_token({"sub": "1"})
print("Generated Token:", access_token)

# Now make the POST request
url = f"http://localhost:8000/api/stories?token={access_token}"
payload = {
    "content": "API post test story",
    "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "file_type": "image",
    "filter_style": "none"
}

headers = {'Content-Type': 'application/json'}

try:
    res = requests.post(url, data=json.dumps(payload), headers=headers)
    print("Status Code:", res.status_code)
    print("Response JSON:", res.json())
except Exception as e:
    print("Error during POST request:", e)
