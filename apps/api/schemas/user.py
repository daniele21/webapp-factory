from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str | None = None
    picture: str | None = None
    roles: List[str] = Field(default_factory=list)
    plan: str | None = None
    credits: int = 0
    metadata: Dict[str, Any] | None = None

class UserProfileCreate(BaseModel):
    id: str
    email: EmailStr
    name: str | None = None
    picture: str | None = None
    hd: str | None = None  # Google Workspace domain if present
    roles: List[str] = Field(default_factory=list)
    plan: str | None = None
    credits: int | None = None
    metadata: Dict[str, Any] | None = None

class UserProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    hd: Optional[str] = None
    roles: Optional[List[str]] = None
    plan: Optional[str] = None
    credits: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class UserProfile(UserPublic):
    hd: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    last_login_at: datetime | None = None


class UserListResponse(BaseModel):
    items: List[UserProfile]
    next_cursor: str | None = None
