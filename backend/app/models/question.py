from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class BloomLevel(str, enum.Enum):
    REMEMBER = "Remember"
    UNDERSTAND = "Understand"
    APPLY = "Apply"
    ANALYZE = "Analyze"
    EVALUATE = "Evaluate"
    CREATE = "Create"


class DifficultyLevel(str, enum.Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    bloom_level = Column(Enum(BloomLevel), nullable=False)
    co_number = Column(String(10), nullable=True)       # e.g. "CO1"
    difficulty = Column(Enum(DifficultyLevel), nullable=False, default=DifficultyLevel.MEDIUM)
    marks = Column(Float, nullable=False, default=2.0)
    year = Column(Integer, nullable=True)                # year question appeared
    topic = Column(String(255), nullable=True)
    question_type = Column(String(50), default="Theory")  # Theory / Numerical / MCQ
    answer_hint = Column(Text, nullable=True)
    is_ai_generated = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", back_populates="questions")


class QuestionPaper(Base):
    __tablename__ = "question_papers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    exam_type = Column(String(100), nullable=True)     # Mid-term, End-term, Quiz
    total_marks = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    config_json = Column(Text, nullable=True)           # JSON of generation config
    paper_json = Column(Text, nullable=True)            # Full paper structure as JSON
    instructions = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="papers")
    subject = relationship("Subject", back_populates="papers")
    paper_questions = relationship("PaperQuestion", back_populates="paper", cascade="all, delete-orphan")


class PaperQuestion(Base):
    __tablename__ = "paper_questions"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("question_papers.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    question_text = Column(Text, nullable=False)       # store text directly for AI-generated
    bloom_level = Column(String(50), nullable=True)
    co_number = Column(String(10), nullable=True)
    difficulty = Column(String(20), nullable=True)
    marks = Column(Float, nullable=False)
    section = Column(String(50), nullable=True)        # Part A, Part B, Part C
    question_number = Column(Integer, nullable=True)
    is_ai_generated = Column(Integer, default=0)

    paper = relationship("QuestionPaper", back_populates="paper_questions")
