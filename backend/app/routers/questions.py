from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.question import Question, BloomLevel, DifficultyLevel
from app.models.subject import Subject
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse, AITopicGenerateRequest
from app.services.ai_service import generate_questions_for_section

router = APIRouter(prefix="/api/questions", tags=["Question Bank"])


def _parse_bloom(val: Optional[str]) -> BloomLevel:
    if not val:
        return BloomLevel.REMEMBER
    for b in BloomLevel:
        if b.value.lower() == str(val).lower():
            return b
    return BloomLevel.REMEMBER


def _parse_diff(val: Optional[str]) -> DifficultyLevel:
    if not val:
        return DifficultyLevel.MEDIUM
    for d in DifficultyLevel:
        if d.value.lower() == str(val).lower():
            return d
    return DifficultyLevel.MEDIUM


@router.post("", response_model=QuestionResponse, status_code=201)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify subject belongs to user
    subject = db.query(Subject).filter(
        Subject.id == payload.subject_id, Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    q = Question(**payload.model_dump(), user_id=current_user.id)
    db.add(q)
    db.commit()
    db.refresh(q)
    return QuestionResponse.model_validate(q)


@router.get("", response_model=List[QuestionResponse])
def list_questions(
    subject_id: Optional[int] = Query(None),
    bloom_level: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    co_number: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Question).filter(Question.user_id == current_user.id)
    if subject_id:
        query = query.filter(Question.subject_id == subject_id)
    if bloom_level:
        query = query.filter(Question.bloom_level == bloom_level)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if co_number:
        query = query.filter(Question.co_number == co_number)
    if year:
        query = query.filter(Question.year == year)
    questions = query.offset(skip).limit(limit).all()
    return [QuestionResponse.model_validate(q) for q in questions]


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Question).filter(
        Question.id == question_id, Question.user_id == current_user.id
    ).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    return QuestionResponse.model_validate(q)


@router.put("/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Question).filter(
        Question.id == question_id, Question.user_id == current_user.id
    ).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(q, field, value)
    db.commit()
    db.refresh(q)
    return QuestionResponse.model_validate(q)


@router.delete("/{question_id}", status_code=204)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Question).filter(
        Question.id == question_id, Question.user_id == current_user.id
    ).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    db.delete(q)
    db.commit()


@router.post("/bulk-import", response_model=dict)
def bulk_import(
    questions: List[QuestionCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bulk import multiple questions at once."""
    added = 0
    for payload in questions:
        subject = db.query(Subject).filter(
            Subject.id == payload.subject_id, Subject.user_id == current_user.id
        ).first()
        if not subject:
            continue
        q = Question(**payload.model_dump(), user_id=current_user.id)
        db.add(q)
        added += 1
    db.commit()
    return {"message": f"Successfully imported {added} questions."}


@router.post("/ai-generate", response_model=List[QuestionResponse])
def ai_generate_questions(
    payload: AITopicGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate questions topic-wise with strict difficulty and Bloom constraints using Gemini AI.
    Optionally saves the generated questions directly into the user's Question Bank.
    """
    subject = db.query(Subject).filter(
        Subject.id == payload.subject_id, Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    co_map = {co.co_number: co.description for co in subject.course_outcomes}
    cos_req = [payload.co_number] if payload.co_number else list(co_map.keys())

    # Fetch some existing questions to prevent duplicates
    existing_q_rows = (
        db.query(Question.question_text)
        .filter(Question.user_id == current_user.id, Question.subject_id == payload.subject_id)
        .limit(15)
        .all()
    )
    existing_texts = [r[0] for r in existing_q_rows]

    bloom_levels = [payload.bloom_level] if payload.bloom_level else ["Apply"]

    ai_generated = generate_questions_for_section(
        subject_name=subject.name,
        topic=payload.topic,
        bloom_levels=bloom_levels,
        co_descriptions=co_map,
        cos_required=cos_req,
        difficulty=payload.difficulty,
        marks_per_question=payload.marks,
        num_questions=payload.num_questions,
        question_type=payload.question_type or "Theory",
        existing_questions=existing_texts,
    )

    saved_questions = []
    for item in ai_generated:
        q_text = str(item.get("question_text", "")).strip()
        b_str = str(item.get("bloom_level", payload.bloom_level or "Apply"))
        co_str = str(item.get("co_number", payload.co_number or "CO1"))
        diff_str = str(item.get("difficulty", payload.difficulty))

        q = Question(
            user_id=current_user.id,
            subject_id=payload.subject_id,
            question_text=q_text,
            topic=payload.topic.strip(),
            bloom_level=_parse_bloom(b_str),
            co_number=co_str,
            difficulty=_parse_diff(diff_str),
            marks=float(item.get("marks", payload.marks)),
            question_type=payload.question_type or "Theory",
            is_ai_generated=1,
        )
        db.add(q)
        db.flush()
        saved_questions.append(q)

    db.commit()
    for q in saved_questions:
        db.refresh(q)

    return [QuestionResponse.model_validate(q) for q in saved_questions]
