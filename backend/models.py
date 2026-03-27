from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)

    age = Column(Integer)
    gender = Column(String)
    yoga_experience = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    health_profile = relationship(
        "HealthProfile",
        back_populates="user",
        uselist=False
    )
    sessions = relationship(
        "YogaSession",
        back_populates="user"
    )


class HealthProfile(Base):
    __tablename__ = "health_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    issue_type = Column(String)
    issue_description = Column(Text)
    has_injury = Column(Boolean)
    injury_description = Column(Text)

    user = relationship("User", back_populates="health_profile")


class YogaSession(Base):
    __tablename__ = "yoga_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    pose_name = Column(String)
    duration_seconds = Column(Integer)
    avg_confidence = Column(Float)
    calories_burned = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")
    feedback = relationship(
        "Feedback",
        back_populates="session",
        uselist=False
    )


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("yoga_sessions.id"))

    relieved = Column(Boolean)
    pain_before = Column(Integer)
    pain_after = Column(Integer)
    comments = Column(Text)

    session = relationship("YogaSession", back_populates="feedback")
    
class Config:
    from_attributes = True
