from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.models.otp import OTPPurpose
from app.schemas.auth import (
    UserCreate, UserLogin, OTPVerify, OTPResend,
    ForgotPassword, ResetPassword, TokenResponse,
    UserResponse, MessageResponse
)
from app.services.email_service import create_and_send_otp, verify_otp

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=MessageResponse, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new faculty account. Sends OTP for email verification."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=409, detail="Email already registered.")
        else:
            # Resend OTP to unverified user
            create_and_send_otp(db, existing.id, existing.email, OTPPurpose.EMAIL_VERIFICATION)
            return MessageResponse(message="Account exists but unverified. OTP resent to your email.")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        department=payload.department,
        institution=payload.institution,
        designation=payload.designation,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    create_and_send_otp(db, user.id, user.email, OTPPurpose.EMAIL_VERIFICATION)
    return MessageResponse(
        message="Registration successful! Please check your email for the OTP.",
        detail=f"OTP sent to {payload.email}"
    )


@router.post("/verify-otp", response_model=TokenResponse)
def verify_email_otp(payload: OTPVerify, db: Session = Depends(get_db)):
    """Verify email with OTP and return JWT token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified.")

    success = verify_otp(db, user.id, payload.otp, OTPPurpose.EMAIL_VERIFICATION)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    user.is_verified = True
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/resend-otp", response_model=MessageResponse)
def resend_otp(payload: OTPResend, db: Session = Depends(get_db)):
    """Resend OTP for email verification."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified.")

    create_and_send_otp(db, user.id, user.email, OTPPurpose.EMAIL_VERIFICATION)
    return MessageResponse(message="OTP resent to your email.")


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password. Returns JWT token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Please verify your email first.",
        )

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPassword, db: Session = Depends(get_db)):
    """Send OTP for password reset."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Security: don't reveal if email exists
        return MessageResponse(message="If this email exists, a reset OTP has been sent.")

    create_and_send_otp(db, user.id, user.email, OTPPurpose.PASSWORD_RESET)
    return MessageResponse(message="Password reset OTP sent to your email.")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPassword, db: Session = Depends(get_db)):
    """Reset password using OTP."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    success = verify_otp(db, user.id, payload.otp, OTPPurpose.PASSWORD_RESET)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return MessageResponse(message="Password reset successfully. You can now log in.")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current logged-in user profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_profile(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user profile fields."""
    allowed = ["name", "department", "institution", "designation"]
    for field in allowed:
        if field in payload:
            setattr(current_user, field, payload[field])
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
