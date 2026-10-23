"""
AI Question Generation Service using Google Gemini API.
Generates questions fitting Bloom's Taxonomy, CO Mapping, and difficulty constraints.
"""
import json
import re
from typing import List, Dict, Optional
import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)


def _get_model():
    return genai.GenerativeModel(
        "gemini-3.8-flash",
        generation_config={"response_mime_type": "application/json"}
    )


def generate_questions_for_section(
    subject_name: str,
    topic: Optional[str],
    bloom_levels: List[str],
    co_descriptions: Dict[str, str],  # {"CO1": "desc", "CO2": "desc"}
    cos_required: List[str],
    difficulty: str,
    marks_per_question: float,
    num_questions: int,
    question_type: str = "Theory",
    existing_questions: Optional[List[str]] = None,
) -> List[Dict]:
    """
    Ask Gemini to generate `num_questions` questions for a paper section.
    Returns a list of dicts with keys: question_text, bloom_level, co_number, difficulty, marks.
    """
    existing_text = ""
    if existing_questions:
        existing_text = "\n\nAvoid repeating these already selected questions:\n" + "\n".join(
            f"- {q}" for q in existing_questions[:10]
        )

    co_context = ""
    if co_descriptions:
        co_context = "\nCourse Outcomes context:\n" + "\n".join(
            f"  {k}: {v}" for k, v in co_descriptions.items() if k in cos_required
        )

    bloom_list = ", ".join(bloom_levels) if bloom_levels else "Any level"
    co_list = ", ".join(cos_required) if cos_required else "Any CO"

    topic_instruction = ""
    if topic and str(topic).strip():
        topic_instruction = f"""
*** MANDATORY TOPIC CONSTRAINT ***:
All questions MUST be formulated STRICTLY and EXCLUSIVELY on the following topic(s):
>>> {str(topic).strip()} <<<
DO NOT ask questions on any other topic or chapter outside of {str(topic).strip()}. Every single question must be directly grounded in this specific topic area.
"""

    difficulty_instruction = f"""
*** MANDATORY DIFFICULTY CONSTRAINT ***:
Every question MUST strictly reflect the '{difficulty.upper()}' difficulty level:
- If 'Easy': Direct definitions, fundamental principles, basic terminology, or single-step formula recall.
- If 'Medium': Conceptual understanding, application of theorems/algorithms, multi-step problem solving, or comparisons.
- If 'Hard': Complex design challenges, critical evaluation, edge cases, deep analysis, architectural trade-offs, or advanced proofs.
"""

    prompt = f"""You are an expert university professor and examination board author.

Target Subject: {subject_name}
{topic_instruction}
{difficulty_instruction}
{co_context}

Generate exactly {num_questions} unique examination question(s) meeting these constraints:
- Topic Scope: {str(topic).strip() if topic and str(topic).strip() else f"Standard syllabus of {subject_name}"}
- Required Difficulty: {difficulty}
- Bloom's Taxonomy Level(s): {bloom_list}
- Course Outcome(s): {co_list}
- Marks per Question: {marks_per_question}
- Question Type: {question_type}
{existing_text}

Return ONLY a valid JSON array. Each element must be an object with these exact keys:
{{
  "question_text": "The complete, clear question text",
  "bloom_level": "One of: Remember/Understand/Apply/Analyze/Evaluate/Create",
  "co_number": "e.g. CO1",
  "difficulty": "{difficulty}",
  "marks": {marks_per_question}
}}

Return ONLY the JSON array, no markdown fences, no explanation."""

    try:
        model = _get_model()
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Strip markdown code fences if present
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text).strip()

        try:
            questions = json.loads(text)
        except Exception:
            match = re.search(r"\[\s*\{.*\}\s*\]", text, re.DOTALL)
            if match:
                questions = json.loads(match.group(0))
            else:
                raise

        if not isinstance(questions, list):
            questions = [questions]

        # Validate and clean
        cleaned = []
        for q in questions:
            cleaned.append({
                "question_text": str(q.get("question_text", "")),
                "bloom_level": str(q.get("bloom_level", bloom_levels[0] if bloom_levels else "Remember")),
                "co_number": str(q.get("co_number", cos_required[0] if cos_required else "CO1")),
                "difficulty": str(q.get("difficulty", difficulty)),
                "marks": float(q.get("marks", marks_per_question)),
                "is_ai_generated": 1,
            })
        return cleaned[:num_questions]

    except Exception as e:
        print(f"[AI Error] Gemini generation failed: {e}")
        # Return placeholder questions on failure
        return [
            {
                "question_text": f"[AI Generation Failed] Question {i+1} on {topic or subject_name} — {bloom_levels[0] if bloom_levels else 'Any'} level",
                "bloom_level": bloom_levels[0] if bloom_levels else "Remember",
                "co_number": cos_required[0] if cos_required else "CO1",
                "difficulty": difficulty,
                "marks": marks_per_question,
                "is_ai_generated": 1,
            }
            for i in range(num_questions)
        ]


def analyze_previous_papers(papers_data: List[Dict]) -> Dict:
    """
    Use Gemini to analyze previous year question patterns and return insights.
    """
    if not papers_data:
        return {"error": "No data to analyze"}

    summary = json.dumps(papers_data[:20], indent=2)  # limit size

    prompt = f"""Analyze these previous year question paper statistics:

{summary}

Provide insights in JSON format:
{{
  "bloom_coverage_insight": "string",
  "difficulty_trend": "string",
  "co_coverage_insight": "string",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "repeat_topics": ["topic1", "topic2"]
}}

Return ONLY valid JSON."""

    try:
        model = _get_model()
        response = model.generate_content(prompt)
        text = response.text.strip()
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return json.loads(text)
    except Exception as e:
        return {"error": str(e)}
