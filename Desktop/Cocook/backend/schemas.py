from pydantic import BaseModel
from typing import Optional, List
import datetime

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str
    name: Optional[str] = None
    bio: Optional[str] = None
    experience_level: Optional[str] = None
    favorite_cuisine: Optional[str] = None

class GoogleAuthRequest(BaseModel):
    token: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    experience_level: Optional[str] = None
    favorite_cuisine: Optional[str] = None
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    experience_level: Optional[str] = None
    favorite_cuisine: Optional[str] = None


class PostCreate(BaseModel):
    content: str

class PostResponse(BaseModel):
    id: int
    content: str
    author: UserResponse
    likes: int
    comments: int
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class RecipePostCreate(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800"
    file_type: Optional[str] = "image"
    filter_style: Optional[str] = None
    tags: str # comma separated list
    time_estimate: Optional[str] = "15 mins"

class RecipePostResponse(BaseModel):
    id: int
    title: str
    content: str
    image_url: Optional[str] = None
    file_type: Optional[str] = "image"
    filter_style: Optional[str] = None
    tags: str
    likes: int
    comments: int
    time_estimate: str
    created_at: datetime.datetime
    author: UserResponse
    class Config:
        from_attributes = True


class FriendRequestResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    status: str
    created_at: datetime.datetime
    sender: UserResponse
    receiver: UserResponse
    class Config:
        from_attributes = True


class StoryCreate(BaseModel):
    content: Optional[str] = None
    image_url: Optional[str] = None
    file_type: Optional[str] = "image"
    filter_style: Optional[str] = None


class StoryResponse(BaseModel):
    id: int
    user_id: int
    content: Optional[str] = None
    image_url: Optional[str] = None
    file_type: Optional[str] = "image"
    filter_style: Optional[str] = None
    created_at: datetime.datetime
    user: UserResponse
    class Config:
        from_attributes = True


class AISuggestionRequest(BaseModel):
    ingredients: str




