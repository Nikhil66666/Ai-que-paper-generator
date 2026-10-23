from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class OTPPurpose(str, enum.Enum):
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"


class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    otp = Column(String(6), nullable=False)
    purpose = Column(Enum(OTPPurpose), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Integer, default=0)  # 0=unused, 1=used
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="otps")
