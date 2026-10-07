"""Authentication schemas."""
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    department: Optional[str] = "Computer Science"
    course_code: Optional[str] = "BCSE406L"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    department: str
    course_code: str
    role: str
