import smtplib
import random
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.otp import OTPCode, OTPPurpose


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an email via Gmail SMTP."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[Email Error] {e}")
        return False


def create_and_send_otp(
    db: Session, user_id: int, email: str, purpose: OTPPurpose
) -> str:
    """Create OTP record and send email. Returns the OTP (for logging only)."""
    # Invalidate previous OTPs for same user/purpose
    db.query(OTPCode).filter(
        OTPCode.user_id == user_id,
        OTPCode.purpose == purpose,
        OTPCode.is_used == 0,
    ).update({"is_used": 1})
    db.commit()

    otp = generate_otp()
    expires = datetime.utcnow() + timedelta(minutes=10)

    otp_record = OTPCode(
        user_id=user_id,
        otp=otp,
        purpose=purpose,
        expires_at=expires,
    )
    db.add(otp_record)
    db.commit()

    # Build email content
    if purpose == OTPPurpose.EMAIL_VERIFICATION:
        subject = "Verify Your Email — AI Question Paper Generator"
        html = _verification_email_html(otp)
    else:
        subject = "Password Reset OTP — AI Question Paper Generator"
        html = _reset_email_html(otp)

    print(f"\n========================================")
    print(f"🔑 [DEV OTP] Code for {email}: {otp}")
    print(f"========================================\n")
    send_email(email, subject, html)
    return otp


def verify_otp(db: Session, user_id: int, otp: str, purpose: OTPPurpose) -> bool:
    record = (
        db.query(OTPCode)
        .filter(
            OTPCode.user_id == user_id,
            OTPCode.otp == otp,
            OTPCode.purpose == purpose,
            OTPCode.is_used == 0,
        )
        .first()
    )
    if not record:
        return False
    if datetime.utcnow() > record.expires_at:
        return False
    record.is_used = 1
    db.commit()
    return True


# ─── Email Templates ─────────────────────────────────────────────────

def _verification_email_html(otp: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;background:#0f0f1a;color:#e0e0e0;margin:0;padding:0;">
      <div style="max-width:500px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
        <div style="background:linear-gradient(135deg,#6c63ff,#3ecfcf);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🎓 AI Question Paper Generator</h1>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#6c63ff;margin-top:0;">Email Verification</h2>
          <p style="color:#b0b0c0;line-height:1.6;">
            Welcome! Please use the OTP below to verify your email address.
          </p>
          <div style="background:#0f0f1a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <p style="color:#888;font-size:13px;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Your OTP</p>
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#6c63ff;">{otp}</span>
          </div>
          <p style="color:#888;font-size:13px;">This OTP expires in <strong style="color:#3ecfcf;">10 minutes</strong>. Do not share it with anyone.</p>
        </div>
        <div style="background:#0f0f1a;padding:16px;text-align:center;">
          <p style="color:#555;font-size:12px;margin:0;">© 2024 AI Question Paper Generator</p>
        </div>
      </div>
    </body>
    </html>
    """


def _reset_email_html(otp: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;background:#0f0f1a;color:#e0e0e0;margin:0;padding:0;">
      <div style="max-width:500px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
        <div style="background:linear-gradient(135deg,#ff6b6b,#ffa94d);padding:30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🔑 Password Reset</h1>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#ff6b6b;margin-top:0;">Reset Your Password</h2>
          <p style="color:#b0b0c0;line-height:1.6;">
            We received a request to reset your password. Use the OTP below.
          </p>
          <div style="background:#0f0f1a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <p style="color:#888;font-size:13px;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Reset OTP</p>
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#ff6b6b;">{otp}</span>
          </div>
          <p style="color:#888;font-size:13px;">Valid for <strong style="color:#ffa94d;">10 minutes</strong>. If you didn't request this, ignore this email.</p>
        </div>
        <div style="background:#0f0f1a;padding:16px;text-align:center;">
          <p style="color:#555;font-size:12px;margin:0;">© 2024 AI Question Paper Generator</p>
        </div>
      </div>
    </body>
    </html>
    """
