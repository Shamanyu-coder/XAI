from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ---------- USER ----------
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    age: int
    gender: str
    yoga_experience: bool


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# ---------- HEALTH PROFILE ----------
class HealthProfileCreate(BaseModel):
    issue_type: str
    issue_description: str
    has_injury: bool
    injury_description: Optional[str] = None


class HealthProfileResponse(HealthProfileCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# ---------- YOGA SESSION ----------
class YogaSessionCreate(BaseModel):
    pose_name: str
    duration_seconds: int
    avg_confidence: float


class YogaSessionResponse(YogaSessionCreate):
    id: int
    calories_burned: float
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- FEEDBACK ----------
class FeedbackCreate(BaseModel):
    session_id: int
    relieved: bool
    pain_before: int
    pain_after: int
    comments: Optional[str] = None


class FeedbackResponse(FeedbackCreate):
    id: int

    class Config:
        from_attributes = True

# ---------- POSE PREDICTION ----------
class PosePredictionRequest(BaseModel):
    image_b64: str
    expected_pose: str

class PosePredictionResponse(BaseModel):
    accuracy: float
    detected_pose: str
    all_predictions: Optional[list] = None
    feedback: Optional[str] = None
