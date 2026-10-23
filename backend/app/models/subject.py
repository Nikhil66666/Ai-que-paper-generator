from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    semester = Column(String(20), nullable=True)
    department = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="subjects")
    course_outcomes = relationship("CourseOutcome", back_populates="subject", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="subject", cascade="all, delete-orphan")
    papers = relationship("QuestionPaper", back_populates="subject")


class CourseOutcome(Base):
    __tablename__ = "course_outcomes"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    co_number = Column(String(10), nullable=False)   # e.g. "CO1", "CO2"
    description = Column(Text, nullable=False)
    bloom_level = Column(String(50), nullable=True)  # e.g. "Remember", "Understand"
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", back_populates="course_outcomes")
