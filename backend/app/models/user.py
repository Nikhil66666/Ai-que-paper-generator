from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    department = Column(String(150), nullable=True)
    institution = Column(String(255), nullable=True)
    designation = Column(String(150), nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subjects = relationship("Subject", back_populates="owner", cascade="all, delete-orphan")
    papers = relationship("QuestionPaper", back_populates="owner", cascade="all, delete-orphan")
    otps = relationship("OTPCode", back_populates="user", cascade="all, delete-orphan")
