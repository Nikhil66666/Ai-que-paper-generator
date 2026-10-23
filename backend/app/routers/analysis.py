"""
Analysis router — Previous year question paper analytics.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from collections import defaultdict

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.question import Question, PaperQuestion, QuestionPaper
from app.models.subject import Subject

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


def _clean_enum_value(val):
    if hasattr(val, "value"):
        return str(val.value)
    s = str(val) if val is not None else ""
    if "." in s:
        return s.split(".")[-1].capitalize()
    return s


@router.get("/bloom-coverage")
def bloom_coverage(
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bloom's taxonomy distribution across all questions in the bank."""
    q = db.query(Question.bloom_level, func.count(Question.id)).filter(
        Question.user_id == current_user.id
    )
    if subject_id:
        q = q.filter(Question.subject_id == subject_id)
    rows = q.group_by(Question.bloom_level).all()

    data = [{"bloom_level": _clean_enum_value(r[0]), "count": r[1]} for r in rows]
    total = sum(d["count"] for d in data)
    for d in data:
        d["percentage"] = round(d["count"] / total * 100, 1) if total > 0 else 0
    return {"data": data, "total_questions": total}


@router.get("/co-coverage")
def co_coverage(
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """CO-wise question distribution."""
    q = db.query(Question.co_number, func.count(Question.id)).filter(
        Question.user_id == current_user.id,
        Question.co_number.isnot(None),
    )
    if subject_id:
        q = q.filter(Question.subject_id == subject_id)
    rows = q.group_by(Question.co_number).all()

    data = [{"co_number": r[0], "count": r[1]} for r in rows]
    return {"data": data}


@router.get("/difficulty-trend")
def difficulty_trend(
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Year-wise difficulty distribution of questions."""
    q = db.query(Question.year, Question.difficulty, func.count(Question.id)).filter(
        Question.user_id == current_user.id,
        Question.year.isnot(None),
    )
    if subject_id:
        q = q.filter(Question.subject_id == subject_id)
    rows = q.group_by(Question.year, Question.difficulty).order_by(Question.year).all()

    trend: dict = defaultdict(dict)
    for year, diff, count in rows:
        trend[year][_clean_enum_value(diff)] = count

    data = [{"year": k, "difficulties": v} for k, v in sorted(trend.items())]
    return {"data": data}


@router.get("/repeat-questions")
def repeat_questions(
    subject_id: Optional[int] = Query(None),
    threshold: int = Query(2, description="Minimum repetitions to flag"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Questions that appear in multiple papers (frequently repeated)."""
    q = db.query(
        PaperQuestion.question_text,
        PaperQuestion.bloom_level,
        PaperQuestion.co_number,
        func.count(PaperQuestion.id).label("count"),
    ).join(
        QuestionPaper, QuestionPaper.id == PaperQuestion.paper_id
    ).filter(
        QuestionPaper.user_id == current_user.id,
    )
    if subject_id:
        q = q.filter(QuestionPaper.subject_id == subject_id)

    rows = (
        q.group_by(PaperQuestion.question_text, PaperQuestion.bloom_level, PaperQuestion.co_number)
        .having(func.count(PaperQuestion.id) >= threshold)
        .order_by(func.count(PaperQuestion.id).desc())
        .limit(20)
        .all()
    )

    return {
        "data": [
            {
                "question_text": r[0],
                "bloom_level": r[1],
                "co_number": r[2],
                "repeat_count": r[3],
            }
            for r in rows
        ]
    }


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard statistics summary."""
    total_subjects = db.query(Subject).filter(Subject.user_id == current_user.id).count()
    bank_questions = db.query(Question).filter(Question.user_id == current_user.id).count()
    total_papers = db.query(QuestionPaper).filter(QuestionPaper.user_id == current_user.id).count()
    ai_in_bank = db.query(Question).filter(
        Question.user_id == current_user.id, Question.is_ai_generated == 1
    ).count()

    # Also count any AI questions in papers not linked to the Question bank
    unlinked_ai_in_papers = (
        db.query(PaperQuestion)
        .join(QuestionPaper, PaperQuestion.paper_id == QuestionPaper.id)
        .filter(
            QuestionPaper.user_id == current_user.id,
            PaperQuestion.is_ai_generated == 1,
            PaperQuestion.question_id.is_(None),
        )
        .count()
    )

    unlinked_all_in_papers = (
        db.query(PaperQuestion)
        .join(QuestionPaper, PaperQuestion.paper_id == QuestionPaper.id)
        .filter(
            QuestionPaper.user_id == current_user.id,
            PaperQuestion.question_id.is_(None),
        )
        .count()
    )

    total_ai = ai_in_bank + unlinked_ai_in_papers
    total_questions = bank_questions + unlinked_all_in_papers
    manual_questions = max(0, total_questions - total_ai)

    return {
        "total_subjects": total_subjects,
        "total_questions": total_questions,
        "total_papers": total_papers,
        "ai_generated_questions": total_ai,
        "manual_questions": manual_questions,
    }

