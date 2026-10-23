import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionAPI, subjectAPI, paperAPI } from '../api';
import toast from 'react-hot-toast';

const BLOOM_LEVELS = ['Remember','Understand','Apply','Analyze','Evaluate','Create'];
const DIFFICULTIES = ['Easy','Medium','Hard'];
const Q_TYPES = ['Theory','Numerical','MCQ','Case Study'];

const bloomBadge = lvl => `badge bloom-${(lvl||'').toLowerCase()}`;
const diffBadge  = d   => `badge diff-${(d||'').toLowerCase()}`;

function AddToExamModal({ questionsToAdd, subjects, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [mode, setMode] = useState('existing'); // 'existing' | 'new'
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [existingSections, setExistingSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [section, setSection] = useState('Part A');
  const [isCustomSection, setIsCustomSection] = useState(false);

  // For new paper
  const defaultSubId = questionsToAdd.length > 0 ? String(questionsToAdd[0].subject_id) : (subjects[0] ? String(subjects[0].id) : '');
  const [newSubId, setNewSubId] = useState(defaultSubId);
  const defaultSubObj = subjects.find(s => String(s.id) === String(defaultSubId));
  const [newTitle, setNewTitle] = useState(defaultSubObj ? `${defaultSubObj.name} Exam Paper` : 'Manual Exam Paper');
  const [newExamType, setNewExamType] = useState('Mid-term Exam');
  const [newDuration, setNewDuration] = useState(180);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    paperAPI.list()
      .then(res => {
        setPapers(res.data);
        if (res.data.length > 0) {
          setSelectedPaperId(res.data[0].id);
          setMode('existing');
        } else {
          setMode('new');
        }
      })
      .catch(() => {
        setMode('new');
      })
      .finally(() => setLoadingPapers(false));
  }, []);

  // Fetch sections for currently selected paper
  useEffect(() => {
    if (mode === 'existing' && selectedPaperId) {
      setLoadingSections(true);
      paperAPI.get(selectedPaperId)
        .then(res => {
          const secs = Array.from(new Set(
            (res.data.paper_questions || [])
              .map(q => q.section)
              .filter(Boolean)
          ));
          setExistingSections(secs);
          if (secs.length > 0) {
            setSection(secs[0]);
            setIsCustomSection(false);
          } else {
            setSection('Part A');
            setIsCustomSection(true);
          }
        })
        .catch(() => {
          setExistingSections([]);
          setIsCustomSection(true);
        })
        .finally(() => setLoadingSections(false));
    }
  }, [mode, selectedPaperId]);

  const totalMarks = questionsToAdd.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const qIds = questionsToAdd.map(q => q.id);

    try {
      let resultPaperId;
      if (mode === 'existing') {
        if (!selectedPaperId) {
          toast.error('Please select an existing exam paper.');
          setSubmitting(false);
          return;
        }
        const res = await paperAPI.addQuestions(selectedPaperId, {
          question_ids: qIds,
          section: section.trim() || 'Part A',
        });
        resultPaperId = res.data.id;
        toast.success(`Added ${qIds.length} question${qIds.length > 1 ? 's' : ''} to exam!`);
      } else {
        if (!newTitle.trim()) {
          toast.error('Please enter an exam paper title.');
          setSubmitting(false);
          return;
        }
        const res = await paperAPI.manualCreate({
          subject_id: Number(newSubId),
          title: newTitle.trim(),
          exam_type: newExamType,
          duration_minutes: Number(newDuration) || 180,
          question_ids: qIds,
          section: section.trim() || 'Part A',
        });
        resultPaperId = res.data.id;
        toast.success('Exam paper created and question(s) added successfully!');
      }

      onSuccess();
      onClose();

      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>View exam paper?</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              toast.dismiss(t.id);
              navigate(`/papers/${resultPaperId}`);
            }}
          >
            Open Exam
          </button>
        </div>
      ), { duration: 6000 });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add questions to exam.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <span className="modal-title">📝 Add to Exam Paper</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary Banner */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                {questionsToAdd.length} Question{questionsToAdd.length > 1 ? 's' : ''} Selected
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Total: {totalMarks} Marks
              </div>
            </div>
            <span className="badge badge-primary">{questionsToAdd.length} Qs • {totalMarks} Marks</span>
          </div>

          {/* Mode Selector Tabs */}
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'existing' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1 }}
              onClick={() => setMode('existing')}
              disabled={papers.length === 0}
            >
              Add to Existing Exam {papers.length > 0 ? `(${papers.length})` : '(None)'}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'new' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1 }}
              onClick={() => setMode('new')}
            >
              Create New Exam Paper
            </button>
          </div>

          {mode === 'existing' ? (
            <div className="form-group">
              <label className="form-label">Select Target Exam Paper *</label>
              {loadingPapers ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading existing papers...</div>
              ) : papers.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No exam papers found. Please switch to "Create New Exam Paper" tab above.
                </div>
              ) : (
                <select
                  className="form-select"
                  value={selectedPaperId}
                  onChange={e => setSelectedPaperId(e.target.value)}
                  required
                >
                  {papers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.exam_type || 'Exam'} • {p.total_marks} Marks)
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <select
                    className="form-select"
                    value={newSubId}
                    onChange={e => {
                      setNewSubId(e.target.value);
                      const s = subjects.find(x => String(x.id) === String(e.target.value));
                      if (s) setNewTitle(`${s.name} - ${newExamType}`);
                    }}
                    required
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Type</label>
                  <select
                    className="form-select"
                    value={newExamType}
                    onChange={e => {
                      setNewExamType(e.target.value);
                      const s = subjects.find(x => String(x.id) === String(newSubId));
                      if (s) setNewTitle(`${s.name} - ${e.target.value}`);
                    }}
                  >
                    <option value="Mid-term Exam">Mid-term Exam</option>
                    <option value="End-term Exam">End-term Exam</option>
                    <option value="Unit Test">Unit Test</option>
                    <option value="Internal Assessment">Internal Assessment</option>
                    <option value="Quiz">Quiz</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Exam Title *</label>
                <input
                  className="form-input"
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Operating Systems - Mid-term 2026"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duration (Minutes)</label>
                <input
                  className="form-input"
                  type="number"
                  value={newDuration}
                  onChange={e => setNewDuration(e.target.value)}
                  min={15}
                  max={360}
                />
              </div>
            </>
          )}

          {/* Section Assignment */}
          <div className="form-group">
            <label className="form-label">Target Exam Section</label>

            {mode === 'existing' && (
              <div style={{ marginBottom: 10 }}>
                {loadingSections ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading exam sections...</div>
                ) : existingSections.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                      Choose existing section in this exam (Same Section):
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      {existingSections.map(sec => (
                        <button
                          key={sec}
                          type="button"
                          className={`btn btn-sm ${section === sec && !isCustomSection ? 'btn-teal' : 'btn-ghost'}`}
                          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                          onClick={() => {
                            setSection(sec);
                            setIsCustomSection(false);
                          }}
                        >
                          ✓ {sec}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={`btn btn-sm ${isCustomSection ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                        onClick={() => {
                          setIsCustomSection(true);
                          setSection('Part C');
                        }}
                      >
                        + New Section...
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    No sections found in this exam yet. Define a section below:
                  </div>
                )}
              </div>
            )}

            {/* Custom Section Input if 'new' paper mode OR user clicked '+ New Section' or no existing sections */}
            {(mode === 'new' || isCustomSection || existingSections.length === 0) && (
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  {['Part A', 'Part B', 'Part C', 'Section 1', 'Section 2'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className={`btn btn-sm ${section === preset ? 'btn-teal' : 'btn-ghost'}`}
                      style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                      onClick={() => setSection(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  className="form-input"
                  type="text"
                  value={section}
                  onChange={e => setSection(e.target.value)}
                  placeholder="e.g. Part A (Short Answer) or Section B"
                  required
                />
              </div>
            )}

            {!isCustomSection && mode === 'existing' && existingSections.length > 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
                Will be added into: <strong>{section}</strong>
              </div>
            )}
          </div>

          {/* Preview list */}
          <div className="form-group">
            <label className="form-label">Questions Preview</label>
            <div style={{
              maxHeight: 140,
              overflowY: 'auto',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: '0.82rem'
            }}>
              {questionsToAdd.map((q, idx) => (
                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, borderBottom: idx < questionsToAdd.length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: 6 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{idx + 1}.</span>
                    {q.question_text}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{q.marks}M</span>
                    <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>{q.bloom_level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || (mode === 'existing' && !selectedPaperId)}
            >
              {submitting ? 'Adding to Exam...' : (mode === 'existing' ? `➕ Add to ${section}` : '🚀 Create Exam & Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionModal({ question, subjects, onClose, onSave }) {
  const [form, setForm] = useState(question ? {
    subject_id: question.subject_id, question_text: question.question_text,
    bloom_level: question.bloom_level, co_number: question.co_number || '',
    difficulty: question.difficulty, marks: question.marks, year: question.year || '',
    topic: question.topic || '', question_type: question.question_type || 'Theory',
    answer_hint: question.answer_hint || '',
  } : { subject_id: '', question_text: '', bloom_level: 'Remember', co_number: '', difficulty: 'Medium', marks: 2, year: '', topic: '', question_type: 'Theory', answer_hint: '' });

  const [loading, setLoading] = useState(false);
  const [coOptions, setCoOptions] = useState([]);

  useEffect(() => {
    if (form.subject_id) {
      subjectAPI.get(form.subject_id).then(r => setCoOptions(r.data.course_outcomes || [])).catch(() => setCoOptions([]));
    }
  }, [form.subject_id]);

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.type === 'number' ? +e.target.value : e.target.value }));

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      if (question) { await questionAPI.update(question.id, form); toast.success('Question updated!'); }
      else { await questionAPI.create(form); toast.success('Question added!'); }
      onSave();
    } catch(err) { toast.error(err.response?.data?.detail || 'Failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:640 }}>
        <div className="modal-header">
          <span className="modal-title">{question ? '✏️ Edit Question' : '➕ Add Question'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <select className="form-select" name="subject_id" value={form.subject_id} onChange={change} required>
              <option value="">Select subject...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Question Text *</label>
            <textarea className="form-textarea" name="question_text" value={form.question_text} onChange={change} rows={4} required />
          </div>
          <div className="grid-3" style={{ gap:12 }}>
            <div className="form-group">
              <label className="form-label">Bloom Level *</label>
              <select className="form-select" name="bloom_level" value={form.bloom_level} onChange={change}>
                {BLOOM_LEVELS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty *</label>
              <select className="form-select" name="difficulty" value={form.difficulty} onChange={change}>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Marks *</label>
              <input className="form-input" type="number" name="marks" value={form.marks} onChange={change} min={1} step={0.5} required />
            </div>
          </div>
          <div className="grid-3" style={{ gap:12 }}>
            <div className="form-group">
              <label className="form-label">CO Number</label>
              <select className="form-select" name="co_number" value={form.co_number} onChange={change}>
                <option value="">None</option>
                {coOptions.map(co => <option key={co.id} value={co.co_number}>{co.co_number}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <input className="form-input" type="number" name="year" value={form.year} onChange={change} placeholder="2023" min={2000} max={2030} />
            </div>
            <div className="form-group">
              <label className="form-label">Question Type</label>
              <select className="form-select" name="question_type" value={form.question_type} onChange={change}>
                {Q_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Topic</label>
            <input className="form-input" name="topic" value={form.topic} onChange={change} placeholder="e.g. Data Structures, Sorting Algorithms" />
          </div>
          <div className="form-group">
            <label className="form-label">Answer Hint (optional)</label>
            <textarea className="form-textarea" name="answer_hint" value={form.answer_hint} onChange={change} rows={2} />
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Question'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AIGenerateModal({ subjects, onClose, onGenerated }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [bloomLevel, setBloomLevel] = useState('Apply');
  const [marks, setMarks] = useState(5);
  const [numQuestions, setNumQuestions] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      toast.error('Please select a subject');
      return;
    }
    if (!topic.trim()) {
      toast.error('Please enter the topic(s) to generate questions on');
      return;
    }
    try {
      setLoading(true);
      toast.loading(`Gemini AI synthesizing ${numQuestions} ${difficulty} questions on '${topic}'...`, { id: 'ai-gen' });
      const res = await questionAPI.aiGenerate({
        subject_id: Number(subjectId),
        topic: topic.trim(),
        difficulty,
        bloom_level: bloomLevel,
        marks: Number(marks),
        num_questions: Number(numQuestions),
        save_to_bank: true,
      });
      toast.success(`Successfully generated ${res.data.length} questions on '${topic}'!`, { id: 'ai-gen' });
      onGenerated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate questions', { id: 'ai-gen' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>✨</span> Topic-Wise AI Question Generator
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 16 }}>
          AI will generate examination questions <strong>strictly and exclusively</strong> on your entered topics matching the chosen difficulty.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Target Subject *</label>
            <select
              className="form-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Topic(s) / Syllabus Focus *</label>
            <input
              type="text"
              className="form-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Binary Search Trees, AVL Tree Rotations, Heap Sort"
              required
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Enter specific chapters, algorithms, or concepts. Questions will be strictly constrained to this topic.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Difficulty Level *</label>
              <select
                className="form-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Easy">Easy (Recall & definitions)</option>
                <option value="Medium">Medium (Application & multi-step)</option>
                <option value="Hard">Hard (Analysis & complex design)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bloom's Taxonomy Level</label>
              <select
                className="form-select"
                value={bloomLevel}
                onChange={(e) => setBloomLevel(e.target.value)}
              >
                {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Marks per Question</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="50"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">No. of Questions</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="10"
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Generating with Gemini...
                </span>
              ) : (
                '✨ Synthesize & Add to Bank'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [filters, setFilters] = useState({ subject_id:'', bloom_level:'', difficulty:'' });

  // Manual Exam Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examModalQuestions, setExamModalQuestions] = useState([]);

  const fetchAll = () => {
    setLoading(true);
    const params = {};
    if (filters.subject_id) params.subject_id = filters.subject_id;
    if (filters.bloom_level) params.bloom_level = filters.bloom_level;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    Promise.all([questionAPI.list(params), subjectAPI.list()])
      .then(([q,s]) => { setQuestions(q.data); setSubjects(s.data); })
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, [filters]);

  const deleteQ = async id => {
    if (!confirm('Delete this question?')) return;
    await questionAPI.delete(id);
    setQuestions(q => q.filter(x => x.id !== id));
    setSelectedIds(prev => prev.filter(x => x !== id));
    toast.success('Question deleted.');
  };

  const toggleSelect = id => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length) setSelectedIds([]);
    else setSelectedIds(questions.map(q => q.id));
  };

  const openExamModal = (qs) => {
    setExamModalQuestions(qs);
    setShowExamModal(true);
  };

  const subjectName = id => subjects.find(s => s.id === id)?.name || '—';

  const selectedQuestions = questions.filter(q => selectedIds.includes(q.id));
  const selectedMarksTotal = selectedQuestions.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  return (
    <div className="container page">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">🗂️ Question Bank</h1>
          <p className="page-subtitle">{questions.length} questions in your bank</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {selectedIds.length > 0 && (
            <button
              className="btn btn-teal"
              onClick={() => openExamModal(selectedQuestions)}
            >
              ➕ Add {selectedIds.length} to Exam
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => setShowAIModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>✨</span>
            <span>AI Generate by Topic</span>
          </button>
          <button className="btn btn-primary" onClick={() => { setEditQ(null); setShowModal(true); }}>
            + Add Question
          </button>
        </div>
      </div>

      {/* Selected questions notification banner */}
      {selectedIds.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(108,99,255,0.12)',
          border: '1px solid var(--accent-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              ✓ {selectedIds.length} question{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <span className="badge badge-gold" style={{ fontSize: '0.78rem' }}>
              {selectedMarksTotal} Marks Total
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openExamModal(selectedQuestions)}
            >
              ➕ Add Selected to Exam
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom:24, padding:'16px 20px' }}>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div className="form-group" style={{ flex:1, minWidth:160 }}>
            <label className="form-label">Subject</label>
            <select className="form-select" value={filters.subject_id} onChange={e => setFilters(p => ({ ...p, subject_id: e.target.value }))}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex:1, minWidth:140 }}>
            <label className="form-label">Bloom Level</label>
            <select className="form-select" value={filters.bloom_level} onChange={e => setFilters(p => ({ ...p, bloom_level: e.target.value }))}>
              <option value="">All Levels</option>
              {BLOOM_LEVELS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex:1, minWidth:130 }}>
            <label className="form-label">Difficulty</label>
            <select className="form-select" value={filters.difficulty} onChange={e => setFilters(p => ({ ...p, difficulty: e.target.value }))}>
              <option value="">All</option>
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ subject_id:'', bloom_level:'', difficulty:'' })}>Clear</button>
        </div>
      </div>

      {loading ? <div className="loading-page"><div className="spinner"/></div> :
       questions.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon">🗂️</div>
          <h3>No questions found</h3><p>Add your first question or change filters</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Question</button>
        </div></div>
       ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={questions.length > 0 && selectedIds.length === questions.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                    title="Select All"
                  />
                </th>
                <th>#</th>
                <th>Question</th>
                <th>Subject</th>
                <th>Bloom</th>
                <th>CO</th>
                <th>Diff</th>
                <th>Marks</th>
                <th>Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>{i+1}</td>
                  <td style={{ maxWidth:280 }}>
                    <div style={{ color:'var(--text-primary)', fontWeight:500, fontSize:'0.88rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {q.question_text}
                    </div>
                    {q.topic && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>{q.topic}</div>}
                    {q.is_ai_generated === 1 && <span className="badge badge-purple" style={{ fontSize:'0.65rem', padding:'1px 6px', marginTop:3 }}>AI</span>}
                  </td>
                  <td style={{ fontSize:'0.82rem' }}>{subjectName(q.subject_id)}</td>
                  <td><span className={bloomBadge(q.bloom_level)}>{q.bloom_level}</span></td>
                  <td>{q.co_number ? <span className="badge badge-teal">{q.co_number}</span> : '—'}</td>
                  <td><span className={diffBadge(q.difficulty)}>{q.difficulty}</span></td>
                  <td><span className="badge badge-gold">{q.marks}M</span></td>
                  <td style={{ fontSize:'0.82rem' }}>{q.year || '—'}</td>
                  <td>
                    <div style={{ display:'flex', gap:6, alignItems: 'center' }}>
                      <button
                        className="btn btn-teal btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', gap: 3 }}
                        title="Add to Exam"
                        onClick={() => openExamModal([q])}
                      >
                        ➕ Exam
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Edit Question" onClick={() => { setEditQ(q); setShowModal(true); }}>✏️</button>
                      <button className="btn btn-danger btn-sm" title="Delete Question" onClick={() => deleteQ(q.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
       )
      }

      {showModal && <QuestionModal question={editQ} subjects={subjects} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchAll(); }} />}
      {showExamModal && (
        <AddToExamModal
          questionsToAdd={examModalQuestions}
          subjects={subjects}
          onClose={() => setShowExamModal(false)}
          onSuccess={() => {
            setSelectedIds([]);
            setShowExamModal(false);
          }}
        />
      )}
      {showAIModal && (
        <AIGenerateModal
          subjects={subjects}
          onClose={() => setShowAIModal(false)}
          onGenerated={() => {
            setShowAIModal(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

