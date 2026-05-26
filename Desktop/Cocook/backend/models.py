from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    avatar = Column(String, nullable=True)
    bio = Column(String, nullable=True, default="Curating flavors for the digital kitchen")
    experience_level = Column(String, nullable=True, default="Novice")
    favorite_cuisine = Column(String, nullable=True, default="Any")
    is_active = Column(Boolean, default=True)
    auth_provider = Column(String) # 'email' or 'google'

class OTP(Base):
    __tablename__ = "otps"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    otp_code = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class CommunityPost(Base):
    __tablename__ = "community_posts"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    author_id = Column(Integer, ForeignKey("users.id"))
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    author = relationship("User")

class RecipePost(Base):
    __tablename__ = "recipe_posts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    image_url = Column(String)
    file_type = Column(String, default="image") # 'image' or 'video'
    filter_style = Column(String, nullable=True) # CSS filter style
    tags = Column(String) # Comma-separated list like "Italian,Pasta,Creamy"
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    time_estimate = Column(String, default="15 mins")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    author_id = Column(Integer, ForeignKey("users.id"))
    author = relationship("User")


class Friendship(Base):
    __tablename__ = "friendships"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending") # 'pending', 'accepted'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


class Story(Base):
    __tablename__ = "stories"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    file_type = Column(String, default="image") # 'image' or 'video'
    filter_style = Column(String, nullable=True) # CSS filter style
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")


