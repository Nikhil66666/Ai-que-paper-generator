"""
AI Smart Question Paper Generator — FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base

# Import all models so SQLAlchemy creates tables
from app.models import User, OTPCode, Subject, CourseOutcome, Question, QuestionPaper, PaperQuestion

# Import routers
from app.routers import auth, subjects, questions, papers, analysis

# ─── Create Tables ──────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ─── FastAPI App ─────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered question paper generator for faculty using Bloom's Taxonomy, CO Mapping, and Gemini AI.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routers ─────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(questions.router)
app.include_router(papers.router)
app.include_router(analysis.router)


# ─── Root & Health ───────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"message": f"Welcome to {settings.APP_NAME} API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy", "service": settings.APP_NAME}
