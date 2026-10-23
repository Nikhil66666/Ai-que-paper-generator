import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { paperAPI, subjectAPI } from '../api';
import toast from 'react-hot-toast';

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function EditPaperQuestionModal({ question, existingSections, courseOutcomes, onClose, onSave }) {
  const [form, setForm] = useState({
    question_text: question.question_text || '',
    marks: question.marks || 2,
    section: question.section || 'Part A',
    bloom_level: question.bloom_level || 'Remember',
    co_number: question.co_number || '',
    difficulty: question.difficulty || 'Medium',
  });
  const [isNewSection, setIsNewSection] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question_text.trim()) {
      toast.error('Question text cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        marks: Number(form.marks),
      });
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title">✏️ Modify Question</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Question Text *</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={form.question_text}
              onChange={e => setForm(p => ({ ...p, question_text: e.target.value }))}
              required
            />
          </div>

          <div className="grid-3" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Marks *</label>
              <input
                className="form-input"
                type="number"
                step="0.5"
                min="0.5"
                value={form.marks}
                onChange={e => setForm(p => ({ ...p, marks: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bloom Level</label>
              <select
                className="form-select"
                value={form.bloom_level}
                onChange={e => setForm(p => ({ ...p, bloom_level: e.target.value }))}
              >
                {BLOOM_LEVELS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Course Outcome (CO)</label>
              <select
                className="form-select"
                value={form.co_number}
                onChange={e => setForm(p => ({ ...p, co_number: e.target.value }))}
              >
                <option value="">None</option>
                {courseOutcomes.map(co => (
                  <option key={co.id || co.co_number} value={co.co_number}>{co.co_number}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                className="form-select"
                value={form.difficulty}
                onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
              >
                {DIFFICULTIES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Exam Section</label>
              {!isNewSection ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    className="form-select"
                    value={form.section}
                    onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
                  >
                    {existingSections.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setIsNewSection(true); setForm(p => ({ ...p, section: '' })); }}
                    title="Type custom section name"
                  >
                    + New
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Part C"
                    value={form.section}
                    onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setIsNewSection(false); setForm(p => ({ ...p, section: existingSections[0] || 'Part A' })); }}
                    title="Choose from existing sections"
                  >
                    List
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddPaperQuestionModal({ initialSection, existingSections, courseOutcomes, onClose, onSave }) {
  const [form, setForm] = useState({
    question_text: '',
    marks: 2,
    section: initialSection || existingSections[0] || 'Part A',
    bloom_level: 'Remember',
    co_number: '',
    difficulty: 'Medium',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question_text.trim()) {
      toast.error('Question text cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        marks: Number(form.marks),
      });
      onClose();
    } catch {
      // handled
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title">➕ Add Question to Section</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Question Text *</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Enter question text..."
              value={form.question_text}
              onChange={e => setForm(p => ({ ...p, question_text: e.target.value }))}
              required
            />
          </div>

          <div className="grid-3" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Marks *</label>
              <input
                className="form-input"
                type="number"
                step="0.5"
                min="0.5"
                value={form.marks}
                onChange={e => setForm(p => ({ ...p, marks: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bloom Level</label>
              <select
                className="form-select"
                value={form.bloom_level}
                onChange={e => setForm(p => ({ ...p, bloom_level: e.target.value }))}
              >
                {BLOOM_LEVELS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Course Outcome (CO)</label>
              <select
                className="form-select"
                value={form.co_number}
                onChange={e => setForm(p => ({ ...p, co_number: e.target.value }))}
              >
                <option value="">None</option>
                {courseOutcomes.map(co => (
                  <option key={co.id || co.co_number} value={co.co_number}>{co.co_number}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                className="form-select"
                value={form.difficulty}
                onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
              >
                {DIFFICULTIES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Section *</label>
              <input
                className="form-input"
                type="text"
                value={form.section}
                onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaperPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [addingToSection, setAddingToSection] = useState(null);

  useEffect(() => {
    fetchPaper();
  }, [id]);

  const fetchPaper = async () => {
    try {
      setLoading(true);
      const res = await paperAPI.get(id);
      setPaper(res.data);
      if (res.data.subject_id) {
        const subRes = await subjectAPI.get(res.data.subject_id);
        setSubject(subRes.data);
      }
    } catch {
      toast.error('Failed to load question paper');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Preparing PDF...', { id: 'pdf-dl' });
      await paperAPI.downloadPDF(id, paper?.title || `question_paper_${id}`);
      toast.success('PDF Downloaded successfully!', { id: 'pdf-dl' });
    } catch {
      toast.error('Failed to download PDF', { id: 'pdf-dl' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this question paper?')) return;
    try {
      await paperAPI.delete(id);
      toast.success('Paper deleted successfully');
      navigate('/history');
    } catch {
      toast.error('Failed to delete paper');
    }
  };

  const handleDeleteQuestion = async (pqId) => {
    if (!window.confirm('Remove this question from the question paper?')) return;
    try {
      const res = await paperAPI.deleteQuestion(id, pqId);
      setPaper(res.data);
      toast.success('Question removed from paper');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove question');
    }
  };

  const handleUpdateQuestion = async (updatedData) => {
    try {
      const res = await paperAPI.updateQuestion(id, editingQuestion.id, updatedData);
      setPaper(res.data);
      toast.success('Question updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update question');
      throw err;
    }
  };

  const handleAddQuestionToSection = async (questionData) => {
    try {
      const res = await paperAPI.addSingleQuestion(id, questionData);
      setPaper(res.data);
      toast.success('Question added to paper successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add question');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px' }} />
        Loading Question Paper...
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h3>Paper not found</h3>
        <Link to="/history" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to History
        </Link>
      </div>
    );
  }

  // Group questions by section
  const sections = {};
  (paper.paper_questions || []).forEach((pq) => {
    const secName = pq.section || 'General Section';
    if (!sections[secName]) sections[secName] = [];
    sections[secName].push(pq);
  });

  const existingSectionNames = Object.keys(sections);
  const courseOutcomes = subject?.course_outcomes || [];

  return (
    <div className="container" style={{ padding: '2rem 1rem 5rem' }}>
      
      {/* Top Action Bar (Hidden on Print) */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1rem 1.5rem',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
          >
            ← Back
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {paper.title}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Generated on {new Date(paper.generated_at).toLocaleString()} • Total Marks: <strong>{paper.total_marks}M</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            🖨️ Print Paper
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            📥 Download PDF
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-ghost"
            style={{ color: 'var(--danger)', padding: '0.5rem 0.75rem' }}
            title="Delete Paper"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Printable Paper Document Container */}
      <div
        className="paper-document"
        style={{
          background: '#ffffff',
          color: '#111827',
          padding: '3rem 3.5rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
          maxWidth: '920px',
          margin: '0 auto',
          fontFamily: "'Inter', 'Times New Roman', serif",
        }}
      >
        {/* Academic Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem', textTransform: 'uppercase', color: '#111827' }}>
            {subject?.department ? `${subject.department} Department` : 'DEPARTMENT OF HIGHER EDUCATION'}
          </h2>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#374151' }}>
            {paper.exam_type || 'EXAMINATION'}
          </h3>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1f2937' }}>
            {subject?.name ? `${subject.name} [${subject.code}]` : paper.title}
          </div>
        </div>

        {/* Paper Meta Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem 2rem',
          fontSize: '0.9rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #d1d5db',
          marginBottom: '1.25rem',
          color: '#374151'
        }}>
          <div><strong>Duration:</strong> {paper.duration_minutes || 180} Minutes</div>
          <div style={{ textAlign: 'right' }}><strong>Maximum Marks:</strong> {paper.total_marks} Marks</div>
          <div><strong>Course Outcomes:</strong> CO1, CO2, CO3, CO4, CO5</div>
          <div style={{ textAlign: 'right' }}><strong>Bloom&apos;s Taxonomy:</strong> Balanced L1 - L6</div>
        </div>

        {/* Instructions */}
        {paper.instructions && (
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.75rem',
            fontSize: '0.875rem',
            color: '#4b5563',
          }}>
            <strong style={{ display: 'block', marginBottom: '0.35rem', color: '#111827' }}>
              Instructions to Candidates:
            </strong>
            <div style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
              {paper.instructions}
            </div>
          </div>
        )}

        {/* Sections & Questions */}
        {Object.entries(sections).map(([secName, questions]) => {
          const sectionTotal = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
          return (
            <div key={secName} style={{ marginBottom: '2.5rem' }}>
              {/* Section Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderBottom: '1.5px solid #374151',
                paddingBottom: '0.4rem',
                marginBottom: '1.25rem',
              }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#111827', textTransform: 'uppercase' }}>
                  {secName}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4b5563' }}>
                    [{sectionTotal} Marks]
                  </span>
                  <button
                    type="button"
                    className="no-print"
                    style={{
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                    onClick={() => setAddingToSection(secName)}
                    title="Add a new question to this section"
                  >
                    + Add Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {questions.map((q, qIndex) => (
                  <div
                    key={q.id || qIndex}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '35px 1fr auto',
                      gap: '0.75rem',
                      alignItems: 'baseline',
                      lineHeight: 1.6,
                      fontSize: '0.95rem',
                      color: '#1f2937',
                    }}
                  >
                    {/* Q Number */}
                    <div style={{ fontWeight: 700, color: '#111827' }}>
                      Q{q.question_number || qIndex + 1}.
                    </div>

                    {/* Q Text */}
                    <div>
                      <div>{q.question_text}</div>
                    </div>

                    {/* Tags, Marks & Edit/Delete actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                      {q.bloom_level && (
                        <span style={{
                          fontSize: '0.725rem',
                          background: '#e0e7ff',
                          color: '#3730a3',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}>
                          {q.bloom_level}
                        </span>
                      )}
                      {q.co_number && (
                        <span style={{
                          fontSize: '0.725rem',
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}>
                          {q.co_number}
                        </span>
                      )}
                      <strong style={{ fontSize: '0.9rem', color: '#111827', marginLeft: '0.25rem' }}>
                        [{q.marks}M]
                      </strong>

                      {/* Modify & Delete Question Actions (Hidden during Print) */}
                      <div className="no-print" style={{ display: 'inline-flex', gap: 4, marginLeft: 6 }}>
                        <button
                          type="button"
                          style={{
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            color: '#374151',
                          }}
                          title="Modify Question"
                          onClick={() => setEditingQuestion(q)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            color: '#b91c1c',
                          }}
                          title="Delete Question"
                          onClick={() => handleDeleteQuestion(q.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Paper Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '1px dashed #9ca3af',
          color: '#6b7280',
          fontSize: '0.8rem',
        }}>
          *** END OF QUESTION PAPER ***
        </div>
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <EditPaperQuestionModal
          question={editingQuestion}
          existingSections={existingSectionNames}
          courseOutcomes={courseOutcomes}
          onClose={() => setEditingQuestion(null)}
          onSave={handleUpdateQuestion}
        />
      )}

      {/* Add Question to Section Modal */}
      {addingToSection && (
        <AddPaperQuestionModal
          initialSection={addingToSection}
          existingSections={existingSectionNames}
          courseOutcomes={courseOutcomes}
          onClose={() => setAddingToSection(null)}
          onSave={handleAddQuestionToSection}
        />
      )}
    </div>
  );
}

