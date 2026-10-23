from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


BLOOM_LEVELS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]
DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"]


# ─── Question ─────────────────────────────────────────────────────────
class QuestionCreate(BaseModel):
    subject_id: int
    question_text: str
    bloom_level: str = Field(..., description="Remember/Understand/Apply/Analyze/Evaluate/Create")
    co_number: Optional[str] = None
    difficulty: str = Field(default="Medium", description="Easy/Medium/Hard")
    marks: float = Field(default=2.0, gt=0)
    year: Optional[int] = None
    topic: Optional[str] = None
    question_type: Optional[str] = "Theory"
    answer_hint: Optional[str] = None


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    bloom_level: Optional[str] = None
    co_number: Optional[str] = None
    difficulty: Optional[str] = None
    marks: Optional[float] = None
    year: Optional[int] = None
    topic: Optional[str] = None
    question_type: Optional[str] = None
    answer_hint: Optional[str] = None


class QuestionResponse(BaseModel):
    id: int
    subject_id: int
    question_text: str
    bloom_level: str
    co_number: Optional[str]
    difficulty: str
    marks: float
    year: Optional[int]
    topic: Optional[str]
    question_type: Optional[str]
    answer_hint: Optional[str]
    is_ai_generated: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Paper Question (inside a generated paper) ────────────────────────
class PaperQuestionOut(BaseModel):
    id: int
    question_text: str
    bloom_level: Optional[str]
    co_number: Optional[str]
    difficulty: Optional[str]
    marks: float
    section: Optional[str]
    question_number: Optional[int]
    is_ai_generated: int

    class Config:
        from_attributes = True


# ─── Paper Generation Request ──────────────────────────────────────────
class SectionConfig(BaseModel):
    name: str = Field(..., example="Part A")
    num_questions: int = Field(..., ge=1)
    marks_per_question: float = Field(..., gt=0)
    bloom_levels: Optional[List[str]] = None
    difficulty: Optional[str] = None
    cos: Optional[List[str]] = None
    topic: Optional[str] = None
    topics: Optional[List[str]] = None


class PaperGenerateRequest(BaseModel):
    subject_id: int
    title: str
    exam_type: Optional[str] = "End-term"
    total_marks: float
    duration_minutes: Optional[int] = 180
    instructions: Optional[str] = None
    sections: List[SectionConfig]
    bloom_distribution: Optional[Dict[str, float]] = None   # {"Remember": 20, "Apply": 40, ...}
    difficulty_split: Optional[Dict[str, float]] = None     # {"Easy": 30, "Medium": 50, "Hard": 20}
    co_mapping: Optional[List[str]] = None                  # ["CO1", "CO2"]
    use_ai_generation: bool = True
    topic: Optional[str] = None
    topics: Optional[List[str]] = None


class AITopicGenerateRequest(BaseModel):
    subject_id: int
    topic: str
    difficulty: str = "Medium"
    bloom_level: Optional[str] = "Apply"
    marks: float = 2.0
    num_questions: int = 5
    co_number: Optional[str] = None
    question_type: Optional[str] = "Theory"
    save_to_bank: bool = True


# ─── Paper Response ────────────────────────────────────────────────────
class QuestionPaperResponse(BaseModel):
    id: int
    user_id: int
    subject_id: Optional[int]
    title: str
    exam_type: Optional[str]
    total_marks: float
    duration_minutes: Optional[int]
    instructions: Optional[str]
    generated_at: datetime
    paper_questions: List[PaperQuestionOut] = []

    class Config:
        from_attributes = True


class QuestionPaperList(BaseModel):
    id: int
    title: str
    exam_type: Optional[str]
    total_marks: float
    generated_at: datetime
    subject_id: Optional[int]

    class Config:
        from_attributes = True


# ─── Manual Add to Paper Schemas ──────────────────────────────────────
class AddQuestionsToPaperRequest(BaseModel):
    question_ids: List[int]
    section: Optional[str] = "Part A"


class ManualPaperCreateRequest(BaseModel):
    subject_id: int
    title: str
    exam_type: Optional[str] = "Manual Exam"
    total_marks: Optional[float] = None
    duration_minutes: Optional[int] = 180
    instructions: Optional[str] = "1. Answer all questions.\n2. Assume suitable missing data if necessary."
    question_ids: List[int]
    section: Optional[str] = "Part A"


class PaperQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    bloom_level: Optional[str] = None
    co_number: Optional[str] = None
    difficulty: Optional[str] = None
    marks: Optional[float] = None
    section: Optional[str] = None
    question_number: Optional[int] = None


class PaperQuestionCreate(BaseModel):
    question_text: str
    bloom_level: Optional[str] = "Remember"
    co_number: Optional[str] = None
    difficulty: Optional[str] = "Medium"
    marks: float = 2.0
    section: Optional[str] = "Part A"
    question_id: Optional[int] = None


