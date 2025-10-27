from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str | None = None
    picture: str | None = None
    role: str | None = "user"

class UserProfileCreate(BaseModel):
    email: EmailStr
    name: str | None = None
    picture: str | None = None
    hd: str | None = None  # Google Workspace domain if present

class UserProfile(UserPublic):
    hd: str | None = None
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime
