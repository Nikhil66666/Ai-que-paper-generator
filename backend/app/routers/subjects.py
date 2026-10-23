from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.subject import Subject, CourseOutcome
from app.schemas.subject import (
    SubjectCreate, SubjectUpdate, SubjectResponse,
    COCreate, COResponse
)

router = APIRouter(prefix="/api/subjects", tags=["Subjects & Course Outcomes"])


# ─── Subjects ────────────────────────────────────────────────────────

@router.post("", response_model=SubjectResponse, status_code=201)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = Subject(**payload.model_dump(), user_id=current_user.id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return SubjectResponse.model_validate(subject)


@router.get("", response_model=List[SubjectResponse])
def list_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    return [SubjectResponse.model_validate(s) for s in subjects]


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id, Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    return SubjectResponse.model_validate(subject)


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id, Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(subject, field, value)
    db.commit()
    db.refresh(subject)
    return SubjectResponse.model_validate(subject)


@router.delete("/{subject_id}", status_code=204)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id, Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    db.delete(subject)
    db.commit()


# ─── Course Outcomes ─────────────────────────────────────────────────

@router.post("/{subject_id}/cos", response_model=COResponse, status_code=201)
def create_co(
    subject_id: int,
    payload: COCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id, Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    co = CourseOutcome(**payload.model_dump(), subject_id=subject_id)
    db.add(co)
    db.commit()
    db.refresh(co)
    return COResponse.model_validate(co)


@router.get("/{subject_id}/cos", response_model=List[COResponse])
def list_cos(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id, Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    return [COResponse.model_validate(co) for co in subject.course_outcomes]


@router.put("/{subject_id}/cos/{co_id}", response_model=COResponse)
def update_co(
    subject_id: int,
    co_id: int,
    payload: COCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    co = db.query(CourseOutcome).filter(
        CourseOutcome.id == co_id, CourseOutcome.subject_id == subject_id
    ).first()
    if not co:
        raise HTTPException(status_code=404, detail="CO not found.")
    for field, value in payload.model_dump().items():
        setattr(co, field, value)
    db.commit()
    db.refresh(co)
    return COResponse.model_validate(co)


@router.delete("/{subject_id}/cos/{co_id}", status_code=204)
def delete_co(
    subject_id: int,
    co_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    co = db.query(CourseOutcome).filter(
        CourseOutcome.id == co_id, CourseOutcome.subject_id == subject_id
    ).first()
    if not co:
        raise HTTPException(status_code=404, detail="CO not found.")
    db.delete(co)
    db.commit()
