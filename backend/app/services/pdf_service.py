"""
PDF generation service using ReportLab.
Generates a professional, styled question paper PDF.
"""
import io
from datetime import datetime
from typing import List, Dict, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import PageBreak


# ─── Custom Colors ────────────────────────────────────────────────────
PRIMARY = colors.HexColor("#1a237e")       # deep indigo
ACCENT = colors.HexColor("#3949ab")        # indigo
LIGHT_BG = colors.HexColor("#e8eaf6")      # very light indigo
HEADER_TEXT = colors.white
SECTION_COLOR = colors.HexColor("#283593")
DIVIDER = colors.HexColor("#9fa8da")
TEXT_COLOR = colors.HexColor("#212121")
LIGHT_TEXT = colors.HexColor("#546e7a")


def generate_paper_pdf(
    paper_title: str,
    institution: str,
    department: str,
    subject_name: str,
    subject_code: str,
    exam_type: str,
    total_marks: float,
    duration_minutes: int,
    instructions: str,
    sections: Dict[str, List[Dict]],   # {"Part A": [q1, q2], "Part B": [...]}
    faculty_name: str = "",
    date: Optional[str] = None,
) -> bytes:
    """
    Generate a professional PDF question paper.
    Returns bytes of the PDF.
    """
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    # ─── Custom Styles ────────────────────────────────────────────────
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=16,
        fontName="Helvetica-Bold",
        textColor=PRIMARY,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    institute_style = ParagraphStyle(
        "Institute",
        parent=styles["Normal"],
        fontSize=13,
        fontName="Helvetica-Bold",
        textColor=PRIMARY,
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica",
        textColor=LIGHT_TEXT,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    section_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Normal"],
        fontSize=12,
        fontName="Helvetica-Bold",
        textColor=HEADER_TEXT,
        alignment=TA_CENTER,
        spaceAfter=0,
        spaceBefore=0,
    )
    question_style = ParagraphStyle(
        "Question",
        parent=styles["Normal"],
        fontSize=10.5,
        fontName="Helvetica",
        textColor=TEXT_COLOR,
        alignment=TA_JUSTIFY,
        leading=15,
        spaceAfter=6,
    )
    instruction_style = ParagraphStyle(
        "Instructions",
        parent=styles["Normal"],
        fontSize=9.5,
        fontName="Helvetica-Oblique",
        textColor=LIGHT_TEXT,
        leading=14,
    )
    bloom_style = ParagraphStyle(
        "Bloom",
        parent=styles["Normal"],
        fontSize=8,
        fontName="Helvetica",
        textColor=LIGHT_TEXT,
    )

    story = []
    exam_date = date or datetime.now().strftime("%B %d, %Y")

    # ─── Header ───────────────────────────────────────────────────────
    story.append(Paragraph(institution or "University / Institution Name", institute_style))
    story.append(Paragraph(f"Department of {department or 'Engineering'}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceAfter=8))

    # Exam info table
    info_data = [
        [
            Paragraph(f"<b>Subject:</b> {subject_name}", question_style),
            Paragraph(f"<b>Code:</b> {subject_code or '—'}", question_style),
        ],
        [
            Paragraph(f"<b>Exam:</b> {exam_type or 'End-term Examination'}", question_style),
            Paragraph(f"<b>Date:</b> {exam_date}", question_style),
        ],
        [
            Paragraph(f"<b>Total Marks:</b> {int(total_marks)}", question_style),
            Paragraph(f"<b>Duration:</b> {duration_minutes or 180} Minutes", question_style),
        ],
    ]
    if faculty_name:
        info_data.append([
            Paragraph(f"<b>Faculty:</b> {faculty_name}", question_style),
            Paragraph("", question_style),
        ])

    info_table = Table(info_data, colWidths=["50%", "50%"])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("GRID", (0, 0), (-1, -1), 0.5, DIVIDER),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10))

    # Title
    story.append(Paragraph(paper_title, title_style))
    story.append(HRFlowable(width="100%", thickness=1, color=DIVIDER, spaceAfter=6))

    # Instructions
    if instructions:
        story.append(Paragraph("<b>Instructions:</b>", instruction_style))
        for line in instructions.split("\n"):
            if line.strip():
                story.append(Paragraph(f"• {line.strip()}", instruction_style))
        story.append(Spacer(1, 10))

    # ─── Sections ─────────────────────────────────────────────────────
    for section_name, questions in sections.items():
        if not questions:
            continue

        section_marks = sum(q.get("marks", 0) for q in questions)

        # Section header
        header_table = Table(
            [[Paragraph(f"{section_name}   (Total: {section_marks} Marks)", section_style)]],
            colWidths=["100%"],
        )
        header_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), SECTION_COLOR),
            ("PADDING", (0, 0), (-1, -1), 10),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [SECTION_COLOR]),
        ]))
        story.append(Spacer(1, 8))
        story.append(KeepTogether([header_table, Spacer(1, 8)]))

        # Questions
        for i, q in enumerate(questions, start=1):
            marks = q.get("marks", 0)
            bloom = q.get("bloom_level", "")
            co = q.get("co_number", "")
            difficulty = q.get("difficulty", "")
            qtext = q.get("question_text", "")

            # Question row
            tag_parts = []
            if bloom:
                tag_parts.append(f"BT: {bloom}")
            if co:
                tag_parts.append(co)
            if difficulty:
                tag_parts.append(difficulty)
            tags = " | ".join(tag_parts)

            q_data = [
                [
                    Paragraph(f"<b>Q{i}.</b>", question_style),
                    Paragraph(qtext, question_style),
                    Paragraph(f"<b>[{int(marks)} M]</b>", question_style),
                ]
            ]
            q_table = Table(q_data, colWidths=[1 * cm, None, 1.8 * cm])
            q_table.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#e0e0e0")),
            ]))

            tag_para = Paragraph(f"<font size='8' color='#888888'>{tags}</font>", bloom_style)

            story.append(KeepTogether([q_table, tag_para, Spacer(1, 4)]))

    # ─── Footer ───────────────────────────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=1, color=DIVIDER))
    story.append(Spacer(1, 6))
    footer_data = [[
        Paragraph("Faculty Signature: _______________", instruction_style),
        Paragraph("HOD Signature: _______________", instruction_style),
        Paragraph(f"Generated on: {datetime.now().strftime('%d-%m-%Y')}", instruction_style),
    ]]
    footer_table = Table(footer_data, colWidths=["33%", "33%", "34%"])
    footer_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(footer_table)

    doc.build(story)
    return buffer.getvalue()
