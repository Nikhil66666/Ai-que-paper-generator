"""
Paper Generation Router — the core AI-powered endpoint.
Combines question bank selection + Gemini AI generation.
"""
import json
from collections import defaultdict
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
import io

from app.core.database import get_db
from app.core.security import get_current_user, decode_token
from app.models.user import User
from app.models.question import Question, QuestionPaper, PaperQuestion, BloomLevel, DifficultyLevel
from app.models.subject import Subject, CourseOutcome
from app.schemas.question import (
    PaperGenerateRequest, QuestionPaperResponse,
    QuestionPaperList, PaperQuestionOut,
    AddQuestionsToPaperRequest, ManualPaperCreateRequest,
    PaperQuestionUpdate, PaperQuestionCreate
)
from app.services.ai_service import generate_questions_for_section
from app.services.pdf_service import generate_paper_pdf

router = APIRouter(prefix="/api/papers", tags=["Question Papers"])
bearer_scheme = HTTPBearer(auto_error=False)


def _parse_bloom_enum(val: Optional[str]) -> BloomLevel:
    if not val:
        return BloomLevel.REMEMBER
    for b in BloomLevel:
        if b.value.lower() == str(val).lower():
            return b
    return BloomLevel.REMEMBER


def _parse_difficulty_enum(val: Optional[str]) -> DifficultyLevel:
    if not val:
        return DifficultyLevel.MEDIUM
    for d in DifficultyLevel:
        if d.value.lower() == str(val).lower():
            return d
    return DifficultyLevel.MEDIUM


def _select_from_bank(
    db: Session,
    user_id: int,
    subject_id: int,
    bloom_levels: List[str],
    cos: List[str],
    difficulty: str,
    marks: float,
    num_needed: int,
    exclude_ids: List[int],
    topic: Optional[str] = None,
) -> List[Question]:
    """Select questions from the bank matching given constraints."""
    q = db.query(Question).filter(
        Question.user_id == user_id,
        Question.subject_id == subject_id,
        Question.id.notin_(exclude_ids) if exclude_ids else True,
    )
    if marks:
        q = q.filter(Question.marks == marks)
    if difficulty:
        q = q.filter(Question.difficulty == difficulty)
    if bloom_levels:
        q = q.filter(Question.bloom_level.in_(bloom_levels))
    if cos:
        q = q.filter(Question.co_number.in_(cos))
    if topic and topic.strip():
        # Match topic against Question.topic or Question.question_text
        keywords = [k.strip() for k in topic.replace(',', ' ').split() if len(k.strip()) >= 3]
        if keywords:
            topic_filters = [
                Question.topic.ilike(f"%{kw}%") | Question.question_text.ilike(f"%{kw}%")
                for kw in keywords
            ]
            q = q.filter(or_(*topic_filters))
    return q.limit(num_needed).all()


@router.post("/generate", response_model=QuestionPaperResponse, status_code=201)
def generate_paper(
    payload: PaperGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Core endpoint: Generate an AI-powered question paper.
    1. Try to select matching questions from the bank.
    2. Use Gemini to generate any remaining questions.
    3. Save paper and questions to DB.
    """
    # Fetch subject info
    subject = db.query(Subject).filter(
        Subject.id == payload.subject_id,
        Subject.user_id == current_user.id,
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    # Build CO descriptions map
    co_map: Dict[str, str] = {
        co.co_number: co.description for co in subject.course_outcomes
    }

    # Create paper record
    paper = QuestionPaper(
        user_id=current_user.id,
        subject_id=payload.subject_id,
        title=payload.title,
        exam_type=payload.exam_type,
        total_marks=payload.total_marks,
        duration_minutes=payload.duration_minutes,
        instructions=payload.instructions,
        config_json=payload.model_dump_json(),
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    used_question_ids: List[int] = []
    paper_questions_to_add: List[PaperQuestion] = []
    question_number = 1

    for section_cfg in payload.sections:
        section_name = section_cfg.name
        bloom_levels = section_cfg.bloom_levels or []
        difficulty = section_cfg.difficulty or "Medium"
        cos_req = section_cfg.cos or list(co_map.keys())
        marks_per_q = section_cfg.marks_per_question
        num_needed = section_cfg.num_questions

        # Resolve topic for section: section-specific topic takes priority, then global topic
        sec_topic = (
            section_cfg.topic
            or (", ".join(section_cfg.topics) if section_cfg.topics else None)
            or payload.topic
            or (", ".join(payload.topics) if payload.topics else None)
        )

        # Step 1: Select from question bank
        bank_questions = _select_from_bank(
            db=db,
            user_id=current_user.id,
            subject_id=payload.subject_id,
            bloom_levels=bloom_levels,
            cos=cos_req,
            difficulty=difficulty,
            marks=marks_per_q,
            num_needed=num_needed,
            exclude_ids=used_question_ids,
            topic=sec_topic,
        )

        for bq in bank_questions:
            pq = PaperQuestion(
                paper_id=paper.id,
                question_id=bq.id,
                question_text=bq.question_text,
                bloom_level=bq.bloom_level.value if hasattr(bq.bloom_level, "value") else str(bq.bloom_level),
                co_number=bq.co_number,
                difficulty=bq.difficulty.value if hasattr(bq.difficulty, "value") else str(bq.difficulty),
                marks=marks_per_q,
                section=section_name,
                question_number=question_number,
                is_ai_generated=0,
            )
            paper_questions_to_add.append(pq)
            used_question_ids.append(bq.id)
            question_number += 1

        # Step 2: Generate remaining with Gemini AI
        remaining = num_needed - len(bank_questions)
        if remaining > 0 and payload.use_ai_generation:
            existing_texts = [bq.question_text for bq in bank_questions]
            ai_questions = generate_questions_for_section(
                subject_name=subject.name,
                topic=sec_topic,
                bloom_levels=bloom_levels or ["Remember", "Understand", "Apply"],
                co_descriptions=co_map,
                cos_required=cos_req,
                difficulty=difficulty,
                marks_per_question=marks_per_q,
                num_questions=remaining,
                existing_questions=existing_texts,
            )
            for aiq in ai_questions:
                q_text = str(aiq.get("question_text", "")).strip()
                b_str = str(aiq.get("bloom_level", bloom_levels[0] if bloom_levels else "Remember"))
                co_str = str(aiq.get("co_number", cos_req[0] if cos_req else "CO1"))
                diff_str = str(aiq.get("difficulty", difficulty))

                # Save AI question to the user's Question Bank repository with topic
                bank_q = Question(
                    user_id=current_user.id,
                    subject_id=payload.subject_id,
                    question_text=q_text,
                    topic=sec_topic,
                    bloom_level=_parse_bloom_enum(b_str),
                    co_number=co_str,
                    difficulty=_parse_difficulty_enum(diff_str),
                    marks=marks_per_q,
                    is_ai_generated=1,
                )
                db.add(bank_q)
                db.flush()

                pq = PaperQuestion(
                    paper_id=paper.id,
                    question_id=bank_q.id,
                    question_text=q_text,
                    bloom_level=b_str,
                    co_number=co_str,
                    difficulty=diff_str,
                    marks=marks_per_q,
                    section=section_name,
                    question_number=question_number,
                    is_ai_generated=1,
                )
                paper_questions_to_add.append(pq)
                question_number += 1

    for pq in paper_questions_to_add:
        db.add(pq)
    db.commit()
    db.refresh(paper)

    return QuestionPaperResponse.model_validate(paper)


@router.post("/manual-create", response_model=QuestionPaperResponse, status_code=201)
def create_manual_paper(
    payload: ManualPaperCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a question paper manually using selected questions from the question bank."""
    subject = db.query(Subject).filter(
        Subject.id == payload.subject_id,
        Subject.user_id == current_user.id,
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")

    questions = db.query(Question).filter(
        Question.id.in_(payload.question_ids),
        Question.user_id == current_user.id,
    ).all()
    if not questions:
        raise HTTPException(status_code=400, detail="No valid questions selected.")

    q_map = {q.id: q for q in questions}
    ordered_questions = [q_map[qid] for qid in payload.question_ids if qid in q_map]
    total_marks = sum(q.marks for q in ordered_questions)

    paper = QuestionPaper(
        user_id=current_user.id,
        subject_id=payload.subject_id,
        title=payload.title,
        exam_type=payload.exam_type,
        total_marks=total_marks,
        duration_minutes=payload.duration_minutes,
        instructions=payload.instructions,
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    section_name = payload.section or "Part A"
    paper_questions = []
    for idx, q in enumerate(ordered_questions, start=1):
        pq = PaperQuestion(
            paper_id=paper.id,
            question_id=q.id,
            question_text=q.question_text,
            bloom_level=q.bloom_level.value if hasattr(q.bloom_level, "value") else str(q.bloom_level),
            co_number=q.co_number,
            difficulty=q.difficulty.value if hasattr(q.difficulty, "value") else str(q.difficulty),
            marks=q.marks,
            section=section_name,
            question_number=idx,
            is_ai_generated=0,
        )
        paper_questions.append(pq)

    db.bulk_save_objects(paper_questions)
    db.commit()
    db.refresh(paper)
    return QuestionPaperResponse.model_validate(paper)


@router.post("/{paper_id}/add-questions", response_model=QuestionPaperResponse)
def add_questions_to_paper(
    paper_id: int,
    payload: AddQuestionsToPaperRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Append questions from question bank manually to an existing question paper."""
    paper = db.query(QuestionPaper).filter(
        QuestionPaper.id == paper_id,
        QuestionPaper.user_id == current_user.id,
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    questions = db.query(Question).filter(
        Question.id.in_(payload.question_ids),
        Question.user_id == current_user.id,
    ).all()
    if not questions:
        raise HTTPException(status_code=400, detail="No valid questions selected.")

    q_map = {q.id: q for q in questions}
    ordered_questions = [q_map[qid] for qid in payload.question_ids if qid in q_map]

    max_q_num = db.query(func.max(PaperQuestion.question_number)).filter(
        PaperQuestion.paper_id == paper.id
    ).scalar() or 0

    section_name = payload.section or "Part A"
    added_marks = 0
    paper_questions = []
    for idx, q in enumerate(ordered_questions, start=1):
        pq = PaperQuestion(
            paper_id=paper.id,
            question_id=q.id,
            question_text=q.question_text,
            bloom_level=q.bloom_level.value if hasattr(q.bloom_level, "value") else str(q.bloom_level),
            co_number=q.co_number,
            difficulty=q.difficulty.value if hasattr(q.difficulty, "value") else str(q.difficulty),
            marks=q.marks,
            section=section_name,
            question_number=max_q_num + idx,
            is_ai_generated=0,
        )
        paper_questions.append(pq)
        added_marks += q.marks

    paper.total_marks = (paper.total_marks or 0) + added_marks
    db.bulk_save_objects(paper_questions)
    db.commit()
    db.refresh(paper)
    return QuestionPaperResponse.model_validate(paper)


@router.get("", response_model=List[QuestionPaperList])
def list_papers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    papers = (
        db.query(QuestionPaper)
        .filter(QuestionPaper.user_id == current_user.id)
        .order_by(QuestionPaper.generated_at.desc())
        .all()
    )
    return [QuestionPaperList.model_validate(p) for p in papers]


@router.get("/{paper_id}", response_model=QuestionPaperResponse)
def get_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = db.query(QuestionPaper).filter(
        QuestionPaper.id == paper_id,
        QuestionPaper.user_id == current_user.id,
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    return QuestionPaperResponse.model_validate(paper)


@router.delete("/{paper_id}", status_code=204)
def delete_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = db.query(QuestionPaper).filter(
        QuestionPaper.id == paper_id,
        QuestionPaper.user_id == current_user.id,
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    db.delete(paper)
    db.commit()


@router.put("/{paper_id}/questions/{pq_id}", response_model=QuestionPaperResponse)
def update_paper_question(
    paper_id: int,
    pq_id: int,
    payload: PaperQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Modify an existing question on a generated question paper."""
    paper = db.query(QuestionPaper).filter(
        QuestionPaper.id == paper_id,
        QuestionPaper.user_id == current_user.id,
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    pq = db.query(PaperQuestion).filter(
        PaperQuestion.id == pq_id,
        PaperQuestion.paper_id == paper.id,
    ).first()
    if not pq:
        raise HTTPException(status_code=404, detail="Question not found in paper.")

    if payload.question_text is not None:
        pq.question_text = payload.question_text
    if payload.bloom_level is not None:
        pq.bloom_level = payload.bloom_level
    if payload.co_number is not None:
        pq.co_number = payload.co_number
    if payload.difficulty is not None:
        pq.difficulty = payload.difficulty
    if payload.marks is not None:
        pq.marks = payload.marks
    if payload.section is not None:
        pq.section = payload.section
    if payload.question_number is not None:
        pq.question_number = payload.question_number

    db.flush()

    # Recalculate paper's total_marks from all questions
    paper.total_marks = sum(q.marks for q in paper.paper_questions)
    db.commit()
    db.refresh(paper)
    return QuestionPaperResponse.model_validate(paper)


@router.delete("/{paper_id}/questions/{pq_id}", response_model=QuestionPaperResponse)
def delete_paper_question(
    paper_id: int,
    pq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a question from a generated question paper and re-index remaining questions."""
    paper = db.query(QuestionPaper).filter(
        QuestionPaper.id == paper_id,
        QuestionPaper.user_id == current_user.id,
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    pq = db.query(PaperQuestion).filter(
        PaperQuestion.id == pq_id,
        PaperQuestion.paper_id == paper.id,
    ).first()
    if not pq:
        raise HTTPException(status_code=404, detail="Question not found in paper.")

    db.delete(pq)
    db.flush()

    # Re-sequence question numbers in this paper
    remaining = (
        db.query(PaperQuestion)
        .filter(PaperQuestion.paper_id == paper.id)
        .order_by(PaperQuestion.question_number.asc())
        .all()
    )
    for idx, item in enumerate(remaining, start=1):
        item.question_number = idx

    paper.total_marks = sum(q.marks for q in remaining)
    db.commit()
    db.refresh(paper)
    return QuestionPaperResponse.model_validate(paper)


@router.post("/{paper_id}/questions", response_model=QuestionPaperResponse, status_code=201)
def add_single_paper_question(
    paper_id: int,
    payload: PaperQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a question directly to a specific section of the paper."""
    paper = db.query(QuestionPaper).filter(
        QuestionPaper.id == paper_id,
        QuestionPaper.user_id == current_user.id,
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    max_num = db.query(func.max(PaperQuestion.question_number)).filter(
        PaperQuestion.paper_id == paper.id
    ).scalar() or 0

    new_pq = PaperQuestion(
        paper_id=paper.id,
        question_id=payload.question_id,
        question_text=payload.question_text,
        bloom_level=payload.bloom_level,
        co_number=payload.co_number,
        difficulty=payload.difficulty,
        marks=payload.marks,
        section=payload.section or "Part A",
        question_number=max_num + 1,
        is_ai_generated=0,
    )
    db.add(new_pq)
    paper.total_marks = (paper.total_marks or 0) + payload.marks
    db.commit()
    db.refresh(paper)
    return QuestionPaperResponse.model_validate(paper)



@router.get("/{paper_id}/pdf")
def download_paper_pdf(
    paper_id: int,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
):
    """Download question paper as a professionally styled PDF."""
    user_id = None
    if credentials and credentials.credentials:
        try:
            payload = decode_token(credentials.credentials)
            user_id = payload.get("sub")
        except Exception:
            pass
    if not user_id and token:
        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
        except Exception:
            pass

    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required to download PDF.")

    current_user = db.query(User).filter(User.id == int(user_id)).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="User not found.")

    paper = db.query(QuestionPaper).filter(
        QuestionPaper.id == paper_id,
        QuestionPaper.user_id == current_user.id,
    ).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    subject = db.query(Subject).filter(Subject.id == paper.subject_id).first()

    # Group questions by section
    sections: Dict[str, list] = defaultdict(list)
    for pq in sorted(paper.paper_questions, key=lambda x: x.question_number or 0):
        sections[pq.section or "Section A"].append({
            "question_text": pq.question_text,
            "bloom_level": pq.bloom_level,
            "co_number": pq.co_number,
            "difficulty": pq.difficulty,
            "marks": pq.marks,
        })

    pdf_bytes = generate_paper_pdf(
        paper_title=paper.title,
        institution=current_user.institution or "",
        department=current_user.department or subject.department if subject else "",
        subject_name=subject.name if subject else "Unknown Subject",
        subject_code=subject.code if subject else "",
        exam_type=paper.exam_type or "Examination",
        total_marks=paper.total_marks,
        duration_minutes=paper.duration_minutes or 180,
        instructions=paper.instructions or "",
        sections=dict(sections),
        faculty_name=current_user.name,
    )

    filename = f"question_paper_{paper_id}_{paper.title.replace(' ', '_')[:30]}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
