# 🎓 Smart AI Question Paper Generator

An enterprise-grade, faculty-centric web application for automated and intelligent exam question paper generation adhering strictly to **Bloom's Taxonomy**, **Course Outcome (CO) Mapping**, **Difficulty Distribution**, and **NBA / NAAC Accreditation Guidelines**.

---

## 🌟 Key Features

1. **Authentication & Security**
   - Faculty Sign Up & Sign In with JWT-based sessions.
   - **Email OTP Verification** (Gmail SMTP) on registration.
   - Secure Forgot Password & OTP Reset flow.
   - Bcrypt password hashing and role protection.

2. **Course & Outcome Management**
   - Manage multiple subjects, course codes, and departments.
   - Map Course Outcomes (CO1, CO2, CO3...) with Bloom's taxonomy cognitive levels.

3. **Intelligent Question Bank**
   - Add and manage questions tagged with marks, difficulty (Easy, Medium, Hard), Bloom level (L1–L6), academic year, and CO.
   - Advanced filters by subject, cognitive level, and difficulty.

4. **AI-Powered Paper Generation**
   - Configurable Section Builder (Part A, Part B, Part C...).
   - Custom marks per question and subtotal calculations.
   - **Hybrid Generation**: Queries the local question bank first, and seamlessly generates remaining questions via **Google Gemini AI** strictly aligned with targeted COs and Bloom levels.

5. **Professional Academic PDF Export**
   - Generates university-standard printable exam PDFs with institutional header, duration, marks, instructions, and taxonomy tags using ReportLab.

6. **Faculty Analytics & Insights**
   - **Bloom's Taxonomy Coverage**: Visual distribution across Remember, Understand, Apply, Analyze, Evaluate, and Create.
   - **CO Attainment Distribution**: Ensures balanced syllabus coverage.
   - **Previous Year Trends**: Repeated questions detection and difficulty trends over academic years.

---

## 🏗️ Architecture & Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy ORM, PyMySQL
- **Database**: MySQL 8.0+
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`)
- **PDF Engine**: ReportLab
- **Frontend**: React 19, Vite, React Router 7, Axios, Lucide Icons, React Hot Toast
- **Design System**: Responsive Dark Mode UI with Glassmorphism, CSS Custom Properties, and Print Styles

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm
- **MySQL Server** (running locally or remotely)
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))
- *(Optional)* Gmail App Password for OTP email verification

---

### 2. Database Setup (MySQL)

Open MySQL CLI or phpMyAdmin / MySQL Workbench:

```sql
CREATE DATABASE ai_question_paper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate python virtual environment (recommended)
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure .env
# Edit backend/.env with your MySQL credentials, Gemini API key, and Gmail credentials
```

#### Run the FastAPI Backend Server:
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs (Swagger UI): `http://localhost:8000/docs`

---

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```

- Application Web UI: `http://localhost:5173`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`):
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_question_paper

# Security
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email (Gmail SMTP for OTPs)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=your_gmail@gmail.com
EMAIL_FROM_NAME="AI Question Paper Generator"

# AI
GEMINI_API_KEY=your_gemini_api_key_here

# App
APP_NAME="AI Question Paper Generator"
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```

---

## 📄 License
MIT License. Built for faculty, educators, and academic institutions worldwide.
