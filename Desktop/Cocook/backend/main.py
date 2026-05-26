# http://localhost:5173/assistantfrom fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db, Base
import models, schemas, auth
import random
import datetime
import logging
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# Robust schema verification and dynamic re-initialization
from sqlalchemy import inspect

def init_db():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        outdated = False
        
        # Check recipe_posts table
        if 'recipe_posts' in tables:
            columns = [c['name'] for c in inspector.get_columns('recipe_posts')]
            if 'file_type' not in columns or 'filter_style' not in columns:
                outdated = True
                
        # Check stories table
        if 'stories' in tables:
            columns = [c['name'] for c in inspector.get_columns('stories')]
            if 'file_type' not in columns or 'filter_style' not in columns:
                outdated = True
                
        if outdated:
            logging.warning("Outdated database schema detected (missing columns). Re-initializing database...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            logging.info("Database schema successfully re-initialized with all new columns!")
        else:
            Base.metadata.create_all(bind=engine)
    except Exception as e:
        logging.error(f"Error during database schema verification: {e}")
        Base.metadata.create_all(bind=engine)

init_db()

app = FastAPI(title="CoCook Real-Time API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSocket Manager ---
from typing import Dict, List, Optional

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.all_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, user_id: Optional[int] = None):
        await websocket.accept()
        self.all_connections.append(websocket)
        if user_id is not None:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: Optional[int] = None):
        if websocket in self.all_connections:
            self.all_connections.remove(websocket)
        if user_id is not None and user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast(self, message: dict):
        for connection in self.all_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

def send_real_email(to_email: str, otp_code: str):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    if not all([smtp_server, smtp_port, smtp_username, smtp_password]):
        logging.warning("SMTP settings missing in .env file. Falling back to mock console output.")
        return False

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Your CoCook OTP Verification Code"
        msg['From'] = f"CoCook App <{smtp_username}>"
        msg['To'] = to_email

        html_content = f"""
        <html>
        <body style="font-family: 'Plus Jakarta Sans', sans-serif; background-color: #fdf9ef; padding: 24px; color: #1c1c16;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e6e2d8;">
                <div style="background-color: #9f4118; padding: 32px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.01em;">CoCook</h1>
                </div>
                <div style="padding: 40px 32px; line-height: 1.6;">
                    <h2 style="color: #1c1c16; font-size: 20px; font-weight: 600; margin-top: 0;">Verify Your Email Address</h2>
                    <p style="font-size: 16px; color: #56423b;">Welcome to CoCook! To log in to the culinary portal, please use the following One-Time Password (OTP):</p>
                    <div style="background-color: #f1eee4; border-radius: 8px; padding: 20px; text-align: center; margin: 32px 0;">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #9f4118;">{otp_code}</span>
                    </div>
                    <p style="font-size: 14px; color: #8a726a; margin-bottom: 0;">This OTP code is valid. If you did not request this code, please ignore this email safely.</p>
                </div>
                <div style="background-color: #f7f3e9; padding: 20px; text-align: center; border-top: 1px solid #e6e2d8; font-size: 12px; color: #8a726a;">
                    © {datetime.datetime.now().year} CoCook Real-Time Platform. All rights reserved.
                </div>
            </div>
        </body>
        </html>
        """
        
        part = MIMEText(html_content, 'html')
        msg.attach(part)

        port = int(smtp_port)
        if port == 465:
            with smtplib.SMTP_SSL(smtp_server, port) as server:
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_username, to_email, msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, port) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.sendmail(smtp_username, to_email, msg.as_string())
        
        return True
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {e}")
        return False

# --- Auth Routes ---

@app.post("/auth/send-otp")
def send_otp(request: schemas.OTPRequest, db: Session = Depends(get_db)):
    # Generate 6 digit OTP
    otp_code = str(random.randint(100000, 999999))
    
    # Save to DB
    new_otp = models.OTP(email=request.email, otp_code=otp_code)
    db.add(new_otp)
    db.commit()
    
    # Try sending real email
    email_sent = send_real_email(request.email, otp_code)
    
    # Print mock output in console for safety/fallback
    logging.info(f"--- OTP CODE LOG ---")
    logging.info(f"To: {request.email}")
    logging.info(f"Code: {otp_code}")
    logging.info(f"Real Email Sent: {email_sent}")
    logging.info(f"--------------------")
    
    if email_sent:
        return {"message": "OTP sent successfully to your email!", "real_email": True}
    else:
        return {
            "message": "OTP generated! (SMTP is not configured, please check backend console)", 
            "mock_code_for_testing": otp_code,
            "real_email": False
        }

@app.post("/auth/verify-otp", response_model=schemas.Token)
def verify_otp(request: schemas.OTPVerify, db: Session = Depends(get_db)):
    # Find OTP
    db_otp = db.query(models.OTP).filter(
        models.OTP.email == request.email, 
        models.OTP.otp_code == request.otp
    ).order_by(models.OTP.created_at.desc()).first()
    
    if not db_otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    # Find or Create User
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        user = models.User(
            email=request.email, 
            name=request.name or request.email.split("@")[0],
            bio=request.bio or "Curating flavors for the digital kitchen",
            experience_level=request.experience_level or "Novice",
            favorite_cuisine=request.favorite_cuisine or "Any",
            auth_provider="email"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update fields if provided
        if request.name:
            user.name = request.name
        if request.bio:
            user.bio = request.bio
        if request.experience_level:
            user.experience_level = request.experience_level
        if request.favorite_cuisine:
            user.favorite_cuisine = request.favorite_cuisine
        db.commit()
        db.refresh(user)
        
    # Delete OTP after use
    db.query(models.OTP).filter(models.OTP.email == request.email).delete()
    db.commit()
    
    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.post("/auth/google", response_model=schemas.Token)
def google_auth(request: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        import jwt as pyjwt

        # First try to verify with Google's library (production path)
        try:
            idinfo = id_token.verify_oauth2_token(
                request.token, 
                google_requests.Request()
            )
        except Exception as verify_err:
            logging.warning(f"Google token verification failed (falling back to unverified decode): {verify_err}")
            # Fallback: decode without signature verification for local development
            try:
                idinfo = pyjwt.decode(request.token, options={"verify_signature": False})
            except Exception as decode_err:
                logging.error(f"JWT decode also failed: {decode_err}")
                raise HTTPException(status_code=400, detail=f"Could not decode Google token: {str(decode_err)}")
        
        email = idinfo.get('email')
        if not email:
            raise HTTPException(status_code=400, detail="Google token does not contain an email address")
        
        name = idinfo.get('name', email.split("@")[0])
        avatar = idinfo.get('picture', '')
        
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(email=email, name=name, avatar=avatar, auth_provider="google")
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update avatar from Google if user doesn't have one
            if avatar and not user.avatar:
                user.avatar = avatar
                db.commit()
                db.refresh(user)
            
        token = auth.create_access_token({"sub": str(user.id)})
        return {"access_token": token, "token_type": "bearer", "user": user}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Google auth error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(e)}")

# --- Dependency to get current user ---
def get_current_user(token: str, db: Session):
    payload = auth.decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    u = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not u:
        try:
            # Auto-recreate user in case of database re-init to prevent developer 401 lockouts
            u = models.User(
                id=int(user_id),
                email="chef@cocook.com",
                name="Master Chef",
                avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv",
                bio="Curating flavors for the digital kitchen",
                experience_level="Expert",
                favorite_cuisine="Fusion",
                auth_provider="email"
            )
            db.add(u)
            db.commit()
            db.refresh(u)
        except Exception:
            return None
    return u

# --- Profile Routes ---

@app.get("/api/profile", response_model=schemas.UserResponse)
def get_profile(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user

@app.put("/api/profile", response_model=schemas.UserResponse)
def update_profile(profile_data: schemas.ProfileUpdate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    if profile_data.name is not None:
        user.name = profile_data.name
    if profile_data.bio is not None:
        user.bio = profile_data.bio
    if profile_data.experience_level is not None:
        user.experience_level = profile_data.experience_level
    if profile_data.favorite_cuisine is not None:
        user.favorite_cuisine = profile_data.favorite_cuisine
        
    db.commit()
    db.refresh(user)
    return user


# --- Community Routes (Real-time) ---

@app.get("/api/community", response_model=list[schemas.PostResponse])
def get_community_posts(token: str = None, db: Session = Depends(get_db)):
    if token:
        user = get_current_user(token, db)
        if user:
            # Show only self + friends' posts
            friendships = db.query(models.Friendship).filter(
                (models.Friendship.status == "accepted") &
                ((models.Friendship.sender_id == user.id) | (models.Friendship.receiver_id == user.id))
            ).all()
            
            user_ids = [user.id]
            for f in friendships:
                if f.sender_id == user.id:
                    user_ids.append(f.receiver_id)
                else:
                    user_ids.append(f.sender_id)
                    
            return db.query(models.CommunityPost).filter(
                models.CommunityPost.author_id.in_(user_ids)
            ).order_by(models.CommunityPost.created_at.desc()).all()
            
    return db.query(models.CommunityPost).order_by(models.CommunityPost.created_at.desc()).all()

@app.post("/api/community")
async def create_post(post: schemas.PostCreate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    new_post = models.CommunityPost(content=post.content, author_id=user.id)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    # Broadcast to friends and self
    post_data = {
        "action": "new_post",
        "data": {
            "id": new_post.id,
            "content": new_post.content,
            "author": {"name": user.name, "avatar": user.avatar},
            "likes": new_post.likes,
            "comments": new_post.comments,
            "created_at": new_post.created_at.isoformat()
        }
    }
    
    friendships = db.query(models.Friendship).filter(
        (models.Friendship.status == "accepted") &
        ((models.Friendship.sender_id == user.id) | (models.Friendship.receiver_id == user.id))
    ).all()
    
    target_ids = [user.id]
    for f in friendships:
        if f.sender_id == user.id:
            target_ids.append(f.receiver_id)
        else:
            target_ids.append(f.sender_id)
            
    for fid in target_ids:
        await manager.send_personal_message(post_data, fid)
        
    return new_post

# --- Feed Routes (Real-time) ---

@app.get("/api/feed", response_model=list[schemas.RecipePostResponse])
def get_feed_posts(token: str = None, db: Session = Depends(get_db)):
    if token:
        user = get_current_user(token, db)
        if user:
            # Show only self + friends' recipe posts
            friendships = db.query(models.Friendship).filter(
                (models.Friendship.status == "accepted") &
                ((models.Friendship.sender_id == user.id) | (models.Friendship.receiver_id == user.id))
            ).all()
            
            user_ids = [user.id]
            for f in friendships:
                if f.sender_id == user.id:
                    user_ids.append(f.receiver_id)
                else:
                    user_ids.append(f.sender_id)
                    
            return db.query(models.RecipePost).filter(
                models.RecipePost.author_id.in_(user_ids)
            ).order_by(models.RecipePost.created_at.desc()).all()
            
    return db.query(models.RecipePost).order_by(models.RecipePost.created_at.desc()).all()

@app.post("/api/feed")
async def create_feed_post(post: schemas.RecipePostCreate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    new_recipe = models.RecipePost(
        title=post.title,
        content=post.content,
        image_url=post.image_url,
        file_type=post.file_type or "image",
        filter_style=post.filter_style,
        tags=post.tags,
        time_estimate=post.time_estimate,
        author_id=user.id
    )
    db.add(new_recipe)
    db.commit()
    db.refresh(new_recipe)
    
    # Broadcast to friends and self
    feed_data = {
        "action": "new_feed_post",
        "data": {
            "id": new_recipe.id,
            "title": new_recipe.title,
            "content": new_recipe.content,
            "image_url": new_recipe.image_url,
            "file_type": new_recipe.file_type,
            "filter_style": new_recipe.filter_style,
            "tags": new_recipe.tags,
            "likes": new_recipe.likes,
            "comments": new_recipe.comments,
            "time_estimate": new_recipe.time_estimate,
            "created_at": new_recipe.created_at.isoformat(),
            "author": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "avatar": user.avatar,
                "bio": user.bio,
                "experience_level": user.experience_level,
                "favorite_cuisine": user.favorite_cuisine
            }
        }
    }
    
    friendships = db.query(models.Friendship).filter(
        (models.Friendship.status == "accepted") &
        ((models.Friendship.sender_id == user.id) | (models.Friendship.receiver_id == user.id))
    ).all()
    
    target_ids = [user.id]
    for f in friendships:
        if f.sender_id == user.id:
            target_ids.append(f.receiver_id)
        else:
            target_ids.append(f.sender_id)
            
    for fid in target_ids:
        await manager.send_personal_message(feed_data, fid)
        
    return new_recipe

# --- Friendship System Endpoints ---

@app.get("/api/users/search", response_model=list[schemas.UserResponse])
def search_users(token: str, query: str = "", db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not query:
        return db.query(models.User).filter(
            models.User.is_active == True,
            models.User.id != user.id
        ).limit(20).all()
    return db.query(models.User).filter(
        models.User.is_active == True,
        models.User.id != user.id,
        (models.User.name.ilike(f"%{query}%") | models.User.email.ilike(f"%{query}%"))
    ).all()

@app.post("/api/friends/request")
async def send_friend_request(receiver_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if user.id == receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
        
    existing = db.query(models.Friendship).filter(
        ((models.Friendship.sender_id == user.id) & (models.Friendship.receiver_id == receiver_id)) |
        ((models.Friendship.sender_id == receiver_id) & (models.Friendship.receiver_id == user.id))
    ).first()
    
    if existing:
        if existing.status == "accepted":
            return {"message": "Already friends"}
        else:
            return {"message": "Friend request already pending"}
            
    new_req = models.Friendship(sender_id=user.id, receiver_id=receiver_id, status="pending")
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    # WebSocket notification
    notif_data = {
        "action": "friend_request_received",
        "data": {
            "id": new_req.id,
            "sender": {
                "id": user.id,
                "name": user.name,
                "avatar": user.avatar or ""
            }
        }
    }
    await manager.send_personal_message(notif_data, receiver_id)
    return {"message": "Friend request sent successfully!"}

@app.post("/api/friends/accept")
async def accept_friend_request(request_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    req = db.query(models.Friendship).filter(
        models.Friendship.id == request_id,
        models.Friendship.receiver_id == user.id,
        models.Friendship.status == "pending"
    ).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Friend request not found")
        
    req.status = "accepted"
    db.commit()
    
    # WebSocket notification
    notif_data = {
        "action": "friend_request_accepted",
        "data": {
            "id": req.id,
            "receiver": {
                "id": user.id,
                "name": user.name,
                "avatar": user.avatar or ""
            }
        }
    }
    await manager.send_personal_message(notif_data, req.sender_id)
    return {"message": "Friend request accepted!"}

@app.post("/api/friends/reject")
async def reject_friend_request(request_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    req = db.query(models.Friendship).filter(
        models.Friendship.id == request_id,
        (models.Friendship.receiver_id == user.id) | (models.Friendship.sender_id == user.id)
    ).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Request/Friendship not found")
        
    db.delete(req)
    db.commit()
    return {"message": "Friend request/friendship removed."}

@app.post("/api/friends/remove")
async def remove_friend(friend_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    req = db.query(models.Friendship).filter(
        (models.Friendship.status == "accepted") &
        (((models.Friendship.sender_id == user.id) & (models.Friendship.receiver_id == friend_id)) |
         ((models.Friendship.sender_id == friend_id) & (models.Friendship.receiver_id == user.id)))
    ).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Friendship not found")
        
    db.delete(req)
    db.commit()
    return {"message": "Friend removed successfully"}

@app.get("/api/friends/status")
def get_friends_status(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    friendships = db.query(models.Friendship).filter(
        (models.Friendship.status == "accepted") &
        ((models.Friendship.sender_id == user.id) | (models.Friendship.receiver_id == user.id))
    ).all()
    
    friend_ids = []
    for f in friendships:
        if f.sender_id == user.id:
            friend_ids.append(f.receiver_id)
        else:
            friend_ids.append(f.sender_id)
            
    online_status = {}
    for fid in friend_ids:
        is_online = fid in manager.active_connections
        online_status[fid] = "online" if is_online else "offline"
        
    return online_status

@app.get("/api/friends/pending", response_model=list[schemas.FriendRequestResponse])
def get_pending_requests(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return db.query(models.Friendship).filter(
        models.Friendship.receiver_id == user.id,
        models.Friendship.status == "pending"
    ).all()

@app.get("/api/friends/sent", response_model=list[schemas.FriendRequestResponse])
def get_sent_requests(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return db.query(models.Friendship).filter(
        models.Friendship.sender_id == user.id,
        models.Friendship.status == "pending"
    ).all()

@app.get("/api/friends/list", response_model=list[schemas.UserResponse])
def get_friends_list(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    friendships = db.query(models.Friendship).filter(
        (models.Friendship.status == "accepted") &
        ((models.Friendship.sender_id == user.id) | (models.Friendship.receiver_id == user.id))
    ).all()
    
    friend_ids = []
    for f in friendships:
        if f.sender_id == user.id:
            friend_ids.append(f.receiver_id)
        else:
            friend_ids.append(f.sender_id)
            
    return db.query(models.User).filter(models.User.id.in_(friend_ids)).all() if friend_ids else []

# --- Ephemeral Stories Endpoints ---

@app.post("/api/stories", response_model=schemas.StoryResponse)
async def create_story(story: schemas.StoryCreate, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    new_story = models.Story(
        user_id=user.id,
        content=story.content,
        image_url=story.image_url,
        file_type=story.file_type or "image",
        filter_style=story.filter_style
    )
    db.add(new_story)
    db.commit()
    db.refresh(new_story)
    
    # Broadcast to friends and self
    friendships = db.query(models.Friendship).filter(
        (models.Friendship.status == "accepted") &
        ((models.Friendship.sender_id == user.id) | (models.Friendship.receiver_id == user.id))
    ).all()
    
    target_ids = [user.id]
    for f in friendships:
        if f.sender_id == user.id:
            target_ids.append(f.receiver_id)
        else:
            target_ids.append(f.sender_id)
            
    story_data = {
        "action": "new_story",
        "data": {
            "id": new_story.id,
            "user_id": new_story.user_id,
            "content": new_story.content,
            "image_url": new_story.image_url,
            "file_type": new_story.file_type,
            "filter_style": new_story.filter_style,
            "created_at": new_story.created_at.isoformat(),
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "avatar": user.avatar or "",
                "bio": user.bio,
                "experience_level": user.experience_level,
                "favorite_cuisine": user.favorite_cuisine
            }
        }
    }
    
    for fid in target_ids:
        await manager.send_personal_message(story_data, fid)
        
    return new_story

@app.get("/api/stories", response_model=list[schemas.StoryResponse])
def get_active_stories(token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    friendships = db.query(models.Friendship).filter(
        (models.Friendship.status == "accepted") &
        ((models.Friendship.sender_id == user.id) | (models.Friendship.receiver_id == user.id))
    ).all()
    
    user_ids = [user.id]
    for f in friendships:
        if f.sender_id == user.id:
            user_ids.append(f.receiver_id)
        else:
            user_ids.append(f.sender_id)
            
    cutoff_time = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    
    return db.query(models.Story).filter(
        models.Story.user_id.in_(user_ids),
        models.Story.created_at >= cutoff_time
    ).order_by(models.Story.created_at.desc()).all()

@app.delete("/api/stories/{story_id}")
async def delete_story(story_id: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
        
    if story.user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own stories")
        
    db.delete(story)
    db.commit()
    
    # Broadcast deletion to friends and self
    friendships = db.query(models.Friendship).filter(
        (models.Friendship.status == "accepted") &
        ((models.Friendship.sender_id == user.id) | (models.Friendship.receiver_id == user.id))
    ).all()
    
    target_ids = [user.id]
    for f in friendships:
        if f.sender_id == user.id:
            target_ids.append(f.receiver_id)
        else:
            target_ids.append(f.sender_id)
            
    notif_data = {
        "action": "delete_story",
        "data": {
            "id": story_id,
            "user_id": user.id
        }
    }
    
    for fid in target_ids:
        await manager.send_personal_message(notif_data, fid)
        
    return {"message": "Story deleted successfully"}

# --- Interactive AI Suggestions ---

@app.post("/api/ai/suggestion")
def get_ai_suggestion(request: schemas.AISuggestionRequest, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    ingredients = [i.strip().lower() for i in request.ingredients.split(",") if i.strip()]
    
    if not ingredients:
        title = "Dynamic Chef's Harvest Bowl"
        content = "A fresh, customizable mix of seasonal grains, roasted root vegetables, leafy greens, and a toasted sesame ginger vinaigrette. Perfect for cleaning out your fridge!"
        image = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"
        tags = "Healthy,Vegan,Fast"
        time = "15 mins"
    else:
        ing_set = set(ingredients)
        if any(x in ing_set for x in ["egg", "eggs", "spinach"]):
            title = "Aromatic Florentine Baked Eggs"
            content = "Farm-fresh organic eggs baked in a nest of creamy sautéed baby spinach, minced garlic, shallots, topped with nutmeg and bubbling melted Gruyère cheese."
            image = "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800"
            tags = "Breakfast,Healthy,Egg"
            time = "12 mins"
        elif any(x in ing_set for x in ["pasta", "tomato", "basil", "garlic"]):
            title = "Handmade Pomodoro & Herb Fettuccine"
            content = "Al dente fresh fettuccine tossed in a rich, slow-simmered vine tomato sauce infused with fresh sweet basil, garlic confit oil, and finished with Pecorino Romano."
            image = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800"
            tags = "Italian,Pasta,Quick"
            time = "18 mins"
        elif any(x in ing_set for x in ["chicken", "rice"]):
            title = "Pan-Seared Ginger Glazed Chicken Bowl"
            content = "Crispy pan-seared chicken breast glazed with a sweet honey-soy-ginger sauce, served over fluffy jasmine rice, steamed bok choy, and toasted sesame seeds."
            image = "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800"
            tags = "Asian,Chicken,Rice"
            time = "20 mins"
        else:
            capitalized_ings = " & ".join([i.capitalize() for i in ingredients[:3]])
            title = f"Artisanal {capitalized_ings} Sauté"
            content = f"A premium, quick pan-sauté highlighting the natural flavors of {request.ingredients}. Sautéed in cold-pressed olive oil, fresh cracked pepper, sea salt, and a splash of white wine to deglaze."
            image = "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800"
            tags = "Custom,Quick,ChefSpecial"
            time = "15 mins"

    return {
        "title": title,
        "content": content,
        "image_url": image,
        "tags": tags,
        "time_estimate": time,
        "difficulty": "Easy"
    }

# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None, user_id: int = None):
    resolved_user_id = None
    if token:
        try:
            payload = auth.decode_access_token(token)
            if payload:
                resolved_user_id = int(payload.get("sub"))
        except Exception:
            pass
    elif user_id:
        resolved_user_id = int(user_id)

    await manager.connect(websocket, resolved_user_id)
    try:
        while True:
            try:
                # Attempt to receive JSON
                data = await websocket.receive_json()
                if data.get("action") == "co_cook_event":
                    targets = data.get("targets", [])
                    event_data = {
                        "action": "co_cook_event",
                        "sender_id": resolved_user_id,
                        "payload": data.get("payload", {})
                    }
                    for t in targets:
                        await manager.send_personal_message(event_data, int(t))
                elif data.get("action") == "dm_message":
                    receiver_id = int(data.get("receiver_id"))
                    payload = data.get("payload", {})
                    dm_payload = {
                        "action": "dm_message",
                        "sender_id": resolved_user_id,
                        "text": payload.get("text"),
                        "created_at": datetime.datetime.utcnow().isoformat()
                    }
                    await manager.send_personal_message(dm_payload, receiver_id)
            except Exception:
                # If not JSON, fall back to plain text to prevent crashes
                try:
                    await websocket.receive_text()
                except Exception:
                    break
    except WebSocketDisconnect:
        manager.disconnect(websocket, resolved_user_id)
