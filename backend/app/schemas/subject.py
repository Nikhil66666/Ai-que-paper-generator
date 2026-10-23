from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── Course Outcomes ────────────────────────────────────────────────
class COCreate(BaseModel):
    co_number: str = Field(..., example="CO1")
    description: str
    bloom_level: Optional[str] = None


class COResponse(BaseModel):
    id: int
    subject_id: int
    co_number: str
    description: str
    bloom_level: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Subjects ────────────────────────────────────────────────────────
class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=2)
    code: Optional[str] = None
    semester: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    semester: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None


class SubjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    code: Optional[str]
    semester: Optional[str]
    department: Optional[str]
    description: Optional[str]
    created_at: datetime
    course_outcomes: List[COResponse] = []

    class Config:
        from_attributes = True
