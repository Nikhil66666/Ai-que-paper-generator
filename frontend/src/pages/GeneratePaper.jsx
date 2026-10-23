import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subjectAPI, paperAPI } from '../api';
import toast from 'react-hot-toast';

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const EXAM_TYPES = ['Mid-term Exam', 'End-term Exam', 'Unit Test', 'Internal Assessment', 'Quiz'];

export default function GeneratePaper() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjectCOs, setSubjectCOs] = useState([]);
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('Mid-term Exam');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [instructions, setInstructions] = useState(
    '1. Answer all questions from Part A.\n2. In Part B, answer any 3 questions.\n3. Assume suitable missing data if necessary.\n4. Neat diagrams carry marks.'
  );
  const [useAIGeneration, setUseAIGeneration] = useState(true);
  const [globalTopic, setGlobalTopic] = useState('');

  // Sections State
  const [sections, setSections] = useState([
    {
      id: 1,
      name: 'Part A (Short Answer)',
      num_questions: 5,
      marks_per_question: 2,
      bloom_levels: ['Remember', 'Understand'],
      difficulty: 'Easy',
      cos: [],
      topic: '',
    },
    {
      id: 2,
      name: 'Part B (Long Answer)',
      num_questions: 4,
      marks_per_question: 10,
      bloom_levels: ['Apply', 'Analyze', 'Evaluate'],
      difficulty: 'Medium',
      cos: [],
      topic: '',
    },
  ]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const res = await subjectAPI.list();
      setSubjects(res.data);
      if (res.data.length > 0) {
        handleSubjectChange(res.data[0].id, res.data);
      }
    } catch {
      toast.error('Failed to load subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubjectChange = async (subId, subsList = subjects) => {
    setSelectedSubjectId(subId);
    const sub = subsList.find((s) => s.id === Number(subId));
    if (sub) {
      setTitle(`${sub.name} - ${examType} Paper`);
      try {
        const coRes = await subjectAPI.listCOs(subId);
        setSubjectCOs(coRes.data);
        // Default COs to all available COs for sections
        const coNums = coRes.data.map((c) => c.co_number);
        setSections((prev) =>
          prev.map((sec) => ({
            ...sec,
            cos: sec.cos.length ? sec.cos : coNums,
          }))
        );
      } catch {
        setSubjectCOs([]);
      }
    }
  };

  const addSection = () => {
    const nextNum = sections.length + 1;
    const char = String.fromCharCode(65 + sections.length);
    const coNums = subjectCOs.map((c) => c.co_number);
    setSections([
      ...sections,
      {
        id: Date.now(),
        name: `Part ${char}`,
        num_questions: 2,
        marks_per_question: 10,
        bloom_levels: ['Apply', 'Analyze'],
        difficulty: 'Medium',
        cos: coNums,
        topic: '',
      },
    ]);
  };

  const removeSection = (id) => {
    if (sections.length <= 1) {
      toast.error('At least one section is required');
      return;
    }
    setSections(sections.filter((s) => s.id !== id));
  };

  const updateSection = (id, field, value) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const toggleBloom = (sectionId, level) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const current = s.bloom_levels || [];
        const next = current.includes(level)
          ? current.filter((l) => l !== level)
          : [...current, level];
        return { ...s, bloom_levels: next };
      })
    );
  };

  const toggleCO = (sectionId, coNum) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const current = s.cos || [];
        const next = current.includes(coNum)
          ? current.filter((c) => c !== coNum)
          : [...current, coNum];
        return { ...s, cos: next };
      })
    );
  };

  const totalCalculatedMarks = sections.reduce(
    (sum, s) => sum + (Number(s.num_questions) || 0) * (Number(s.marks_per_question) || 0),
    0
  );
  const totalQuestionsCount = sections.reduce(
    (sum, s) => sum + (Number(s.num_questions) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      toast.error('Please select a subject');
      return;
    }
    if (!title.trim()) {
      toast.error('Paper title is required');
      return;
    }
    if (sections.some((s) => (Number(s.num_questions) || 0) <= 0)) {
      toast.error('Questions count in each section must be at least 1');
      return;
    }

    const payload = {
      subject_id: Number(selectedSubjectId),
      title: title.trim(),
      exam_type: examType,
      total_marks: totalCalculatedMarks,
      duration_minutes: Number(durationMinutes),
      instructions: instructions.trim(),
      use_ai_generation: useAIGeneration,
      topic: globalTopic.trim() || undefined,
      sections: sections.map((s) => ({
        name: s.name,
        num_questions: Number(s.num_questions),
        marks_per_question: Number(s.marks_per_question),
        bloom_levels: s.bloom_levels.length ? s.bloom_levels : BLOOM_LEVELS,
        difficulty: s.difficulty,
        cos: s.cos.length ? s.cos : undefined,
        topic: s.topic?.trim() || undefined,
      })),
    };

    try {
      setGenerating(true);
      toast.loading('Generating AI Question Paper with Bloom & CO mapping...', { id: 'gen' });
      const res = await paperAPI.generate(payload);
      toast.success('Question Paper generated successfully!', { id: 'gen' });
      navigate(`/papers/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate paper', { id: 'gen' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.75rem' }}>✨</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Smart Question Paper Generator</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
          Generate rigorous, NBA/NAAC-compliant exam papers with automated Bloom&apos;s taxonomy balancing, Course Outcome (CO) mapping, and difficulty split.
        </p>
      </div>

      {loadingSubjects ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading subjects and configurations...
        </div>
      ) : subjects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No Subjects Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Please add at least one subject with Course Outcomes (COs) before generating a question paper.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/subjects')}>
            Go to Subjects Manager
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
            
            {/* Left Column: Config & Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Paper Metadata Card */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📋</span> Paper Details
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label className="label">Target Subject *</label>
                    <select
                      className="select"
                      value={selectedSubjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      required
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Exam Type *</label>
                    <select
                      className="select"
                      value={examType}
                      onChange={(e) => {
                        setExamType(e.target.value);
                        const sub = subjects.find((s) => s.id === Number(selectedSubjectId));
                        if (sub) setTitle(`${sub.name} - ${e.target.value}`);
                      }}
                    >
                      {EXAM_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="label">Paper Title *</label>
                  <input
                    type="text"
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms - Mid Term Exam 2026"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label className="label">Duration (Minutes)</label>
                    <input
                      type="number"
                      className="input"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      min="15"
                      max="360"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">AI Auto-Generation</label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        height: '42px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setUseAIGeneration(!useAIGeneration)}
                    >
                      <input
                        type="checkbox"
                        checked={useAIGeneration}
                        onChange={(e) => setUseAIGeneration(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        Use Gemini AI for missing questions
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="label" style={{ marginBottom: 0 }}>
                      Syllabus Focus Topics (Optional)
                    </label>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Fallback across all sections
                    </span>
                  </div>
                  <input
                    type="text"
                    className="input"
                    value={globalTopic}
                    onChange={(e) => setGlobalTopic(e.target.value)}
                    placeholder="e.g. Unit 1: Data Structures, Unit 2: Trees & Graphs, Unit 3: Dynamic Programming"
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    AI will use these syllabus topics as the default scope for questions across all sections.
                  </div>
                </div>

                <div>
                  <label className="label">Exam Instructions</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Instructions to candidates..."
                  />
                </div>
              </div>

              {/* Section Builder */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🧩</span> Exam Sections ({sections.length})
                  </h3>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addSection}
                    style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
                  >
                    + Add Section
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="card"
                      style={{
                        padding: '1.5rem',
                        borderLeft: `4px solid ${idx % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <input
                          type="text"
                          className="input"
                          style={{ fontWeight: 700, fontSize: '1.05rem', maxWidth: '300px' }}
                          value={sec.name}
                          onChange={(e) => updateSection(sec.id, 'name', e.target.value)}
                          placeholder="Section Name"
                          required
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
                            Subtotal: {(Number(sec.num_questions) || 0) * (Number(sec.marks_per_question) || 0)} Marks
                          </span>
                          {sections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSection(sec.id)}
                              className="btn btn-ghost"
                              style={{ color: 'var(--danger)', padding: '0.4rem 0.6rem' }}
                              title="Delete Section"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                          <label className="label">No. of Questions</label>
                          <input
                            type="number"
                            className="input"
                            value={sec.num_questions}
                            onChange={(e) => updateSection(sec.id, 'num_questions', Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            max="30"
                            required
                          />
                        </div>

                        <div>
                          <label className="label">Marks / Question</label>
                          <input
                            type="number"
                            className="input"
                            value={sec.marks_per_question}
                            onChange={(e) => updateSection(sec.id, 'marks_per_question', Math.max(1, parseFloat(e.target.value) || 1))}
                            min="0.5"
                            step="0.5"
                            required
                          />
                        </div>

                        <div>
                          <label className="label">Difficulty</label>
                          <select
                            className="select"
                            value={sec.difficulty}
                            onChange={(e) => updateSection(sec.id, 'difficulty', e.target.value)}
                          >
                            {DIFFICULTIES.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Section Focus Topic */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <label className="label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🎯</span> Section Focus Topic(s) / Units (Optional)
                          </label>
                          <span style={{ fontSize: '0.74rem', color: sec.topic ? 'var(--secondary)' : 'var(--text-muted)', fontWeight: 600 }}>
                            {sec.topic ? '⚡ Topic-Constrained Generation Active' : (globalTopic ? 'Using Global Topics' : 'General Subject Scope')}
                          </span>
                        </div>
                        <input
                          type="text"
                          className="input"
                          value={sec.topic || ''}
                          onChange={(e) => updateSection(sec.id, 'topic', e.target.value)}
                          placeholder="e.g. Binary Search Trees, AVL Rotations, Heap Sort"
                        />
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          AI will generate questions <strong>strictly on these entered topics</strong> at <strong>{sec.difficulty}</strong> difficulty.
                        </div>
                      </div>

                      {/* Bloom's Taxonomy Selection */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Target Bloom&apos;s Taxonomy Levels</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {sec.bloom_levels.length} selected
                          </span>
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {BLOOM_LEVELS.map((lvl) => {
                            const active = sec.bloom_levels.includes(lvl);
                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => toggleBloom(sec.id, lvl)}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.8rem',
                                  borderRadius: 'var(--radius-full)',
                                  border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                                  background: active ? 'rgba(108, 99, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                  color: active ? '#fff' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {lvl} {active ? '✓' : '+'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* CO Mapping Selection */}
                      {subjectCOs.length > 0 && (
                        <div>
                          <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Target Course Outcomes (COs)</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {sec.cos.length} selected
                            </span>
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {subjectCOs.map((co) => {
                              const active = sec.cos.includes(co.co_number);
                              return (
                                <button
                                  key={co.id}
                                  type="button"
                                  onClick={() => toggleCO(sec.id, co.co_number)}
                                  title={co.description}
                                  style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.8rem',
                                    borderRadius: 'var(--radius-full)',
                                    border: active ? '1px solid var(--secondary)' : '1px solid var(--border)',
                                    background: active ? 'rgba(6, 214, 160, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                                    color: active ? 'var(--secondary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {co.co_number} {active ? '✓' : '+'}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Summary & Action */}
            <div style={{ position: 'sticky', top: '90px' }}>
              <div className="card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                  📊 Paper Summary
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Questions:</span>
                    <strong style={{ fontSize: '1.1rem' }}>{totalQuestionsCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Marks:</span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--secondary)' }}>
                      {totalCalculatedMarks} M
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Duration:</span>
                    <span>{durationMinutes} mins</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Sections:</span>
                    <span>{sections.length}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>
                    SECTION BREAKDOWN
                  </div>
                  {sections.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {s.name || `Section ${i + 1}`} ({s.num_questions}Q · {s.difficulty})
                        </span>
                        <span>{(s.num_questions || 0) * (s.marks_per_question || 0)} marks</span>
                      </div>
                      {(s.topic || globalTopic) && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                          🎯 Topic: {s.topic || globalTopic}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={generating || totalQuestionsCount <= 0}
                  style={{ width: '100%', padding: '0.85rem', fontWeight: 700, fontSize: '1rem' }}
                >
                  {generating ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span className="spinner" style={{ width: '18px', height: '18px' }} />
                      Generating Paper...
                    </span>
                  ) : (
                    '🚀 Generate Paper with AI'
                  )}
                </button>

                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem', margin: 0 }}>
                  Queries your local Question Bank first, and dynamically synthesizes missing questions via Gemini AI.
                </p>
              </div>
            </div>

          </div>
        </form>
      )}
    </div>
  );
}
