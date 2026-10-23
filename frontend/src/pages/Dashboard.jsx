import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Layers,
  FileText,
  BrainCircuit,
  Plus,
  Search,
  Eye,
  Download,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  BarChart2,
  Clock,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analysisAPI, paperAPI, subjectAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const BLOOM_LEVELS = [
  { name: 'Remember', color: '#60a5fa', desc: 'Knowledge & Recall' },
  { name: 'Understand', color: '#34d399', desc: 'Comprehension & Meaning' },
  { name: 'Apply', color: '#f59e0b', desc: 'Practical Application' },
  { name: 'Analyze', color: '#ec4899', desc: 'Breaking Down Concepts' },
  { name: 'Evaluate', color: '#8b5cf6', desc: 'Critique & Justify' },
  { name: 'Create', color: '#06d6a0', desc: 'Synthesis & Generation' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentPapers, setRecentPapers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [bloomData, setBloomData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    Promise.all([
      analysisAPI.summary().catch(() => ({ data: null })),
      paperAPI.list().catch(() => ({ data: [] })),
      subjectAPI.list().catch(() => ({ data: [] })),
      analysisAPI.bloomCoverage().catch(() => ({ data: { data: [] } })),
    ])
      .then(([s, p, sub, b]) => {
        if (s?.data) setSummary(s.data);
        if (p?.data) setRecentPapers(p.data);
        if (sub?.data) setSubjects(sub.data);
        if (b?.data?.data) setBloomData(b.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPDF = async (paperId, title) => {
    try {
      setDownloadingId(paperId);
      await paperAPI.downloadPDF(paperId, title);
      toast.success('Question paper downloaded successfully');
    } catch {
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Map subject ID to Name
  const subjectMap = useMemo(() => {
    const map = {};
    subjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  // Dynamic greeting based on current time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Computed AI Generation Ratio
  const totalQs = summary?.total_questions || 0;
  const aiQs = summary?.ai_generated_questions || 0;
  const manualQs = summary?.manual_questions || (totalQs - aiQs);
  const aiRatio = totalQs > 0 ? Math.round((aiQs / totalQs) * 100) : 0;

  // Filtered recent papers
  const filteredPapers = useMemo(() => {
    if (!searchQuery.trim()) return recentPapers.slice(0, 7);
    const q = searchQuery.toLowerCase();
    return recentPapers
      .filter((p) =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.exam_type && p.exam_type.toLowerCase().includes(q)) ||
        (subjectMap[p.subject_id]?.name && subjectMap[p.subject_id].name.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [recentPapers, searchQuery, subjectMap]);

  // Bloom counts map
  const bloomMap = useMemo(() => {
    const map = {};
    bloomData.forEach((item) => {
      if (item.bloom_level) {
        const key = String(item.bloom_level).toLowerCase().replace(/bloomlevel\./g, '');
        map[key] = (map[key] || 0) + (Number(item.count) || 0);
      }
    });
    return map;
  }, [bloomData]);

  const maxBloomCount = useMemo(() => {
    return Math.max(...BLOOM_LEVELS.map((b) => bloomMap[b.name.toLowerCase()] || 0), 1);
  }, [bloomMap]);

  if (loading) {
    return (
      <div className="container page">
        <div className="loading-page">
          <div className="spinner" style={{ width: 36, height: 36 }} />
          <p style={{ fontWeight: 500, letterSpacing: '0.02em' }}>Loading academic command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page dashboard-root">
      {/* ─── Hero Welcome Section ─── */}
      <section className="dash-hero">
        <div className="dash-hero-glow" />
        <div className="dash-hero-content">
          <div className="dash-hero-badge">
            <span className="pulse-dot" />
            <span>AI Examination Engine · Gemini 2.5 Active</span>
          </div>

          <h1 className="dash-hero-title">
            {greeting}, {user?.name ? user.name.split(' ')[0] : 'Professor'} 👋
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', lineHeight: 1.5 }}>
            Welcome to your intelligent question paper synthesizer and assessment analytics workspace.
          </p>

          <div className="dash-hero-meta">
            <span className="dash-meta-tag">
              <GraduationCap size={14} style={{ color: 'var(--accent-primary)' }} />
              {user?.designation || 'Faculty Member'}
            </span>
            {user?.department && (
              <span className="dash-meta-tag">
                Dept: {user.department}
              </span>
            )}
            {user?.institution && (
              <span className="dash-meta-tag">
                {user.institution}
              </span>
            )}
          </div>
        </div>

        <div className="dash-hero-actions">
          <Link to="/questions" className="btn btn-secondary">
            <Plus size={16} />
            Add Questions
          </Link>
          <Link to="/generate" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            <Sparkles size={17} />
            Generate Paper
          </Link>
        </div>
      </section>

      {/* ─── KPI Metrics Deck ─── */}
      <section className="kpi-grid">
        {/* KPI 1: Total Subjects */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap kpi-icon-purple">
              <Layers size={22} />
            </div>
            <span className="kpi-badge kpi-badge-neutral">Curricula</span>
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{summary?.total_subjects ?? subjects.length ?? 0}</div>
            <div className="kpi-label">Active Subjects</div>
          </div>
          <div className="kpi-footer">
            <span>OBE & Bloom mapped</span>
            <Link to="/subjects" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              Manage →
            </Link>
          </div>
        </div>

        {/* KPI 2: Total Questions */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap kpi-icon-teal">
              <BookOpen size={22} />
            </div>
            <span className="kpi-badge kpi-badge-neutral">{aiRatio}% AI</span>
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{totalQs}</div>
            <div className="kpi-label">Total Questions Bank</div>
            <div className="kpi-progress-bar" title={`${aiQs} AI Generated / ${manualQs} Faculty Curated`}>
              <div
                className="kpi-progress-fill"
                style={{ width: `${aiRatio}%`, background: 'var(--accent-secondary)' }}
              />
              <div
                className="kpi-progress-fill"
                style={{ width: `${100 - aiRatio}%`, background: 'var(--accent-primary)' }}
              />
            </div>
          </div>
          <div className="kpi-footer">
            <span>{aiQs} AI · {manualQs} Faculty</span>
            <Link to="/questions" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              Browse →
            </Link>
          </div>
        </div>

        {/* KPI 3: Total Papers Generated */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap kpi-icon-green">
              <FileText size={22} />
            </div>
            <span className="kpi-badge kpi-badge-positive">Ready for PDF</span>
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{summary?.total_papers ?? recentPapers.length ?? 0}</div>
            <div className="kpi-label">Papers Generated</div>
          </div>
          <div className="kpi-footer">
            <span>Formatted & balanced</span>
            <Link to="/history" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              History →
            </Link>
          </div>
        </div>

        {/* KPI 4: AI Synthesis Rate */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap kpi-icon-gold">
              <BrainCircuit size={22} />
            </div>
            <span className="kpi-badge kpi-badge-positive">Gemini Pro</span>
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{aiQs}</div>
            <div className="kpi-label">AI Synthesized Qs</div>
          </div>
          <div className="kpi-footer">
            <span>Automated question design</span>
            <Link to="/analysis" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              Audit →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Command Actions Deck ─── */}
      <section>
        <div className="deck-section-title">
          <div className="section-heading">
            <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
            Core Workflows
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            One-click access to examination suites
          </span>
        </div>

        <div className="actions-deck">
          {/* Action 1: Paper Generator */}
          <Link to="/generate" className="action-card featured">
            <div className="action-card-glow" style={{ background: 'var(--accent-primary)' }} />
            <div>
              <div className="action-top">
                <div className="action-icon-box" style={{ background: 'rgba(108, 99, 255, 0.15)', color: 'var(--accent-primary)' }}>
                  <Sparkles size={20} />
                </div>
                <span className="action-tag" style={{ background: 'rgba(108, 99, 255, 0.2)', color: 'var(--accent-primary)' }}>
                  AI Generator
                </span>
              </div>
              <div className="action-title">Create Question Paper</div>
              <p className="action-desc">
                Synthesize fully balanced exam papers with custom section weighting, Bloom taxonomy, and CO constraints.
              </p>
            </div>
            <div className="action-footer">
              <span>Launch Paper Studio</span>
              <ArrowRight size={14} />
            </div>
          </Link>

          {/* Action 2: Question Repository */}
          <Link to="/questions" className="action-card">
            <div className="action-card-glow" style={{ background: 'var(--accent-secondary)' }} />
            <div>
              <div className="action-top">
                <div className="action-icon-box" style={{ background: 'rgba(62, 207, 207, 0.15)', color: 'var(--accent-secondary)' }}>
                  <BookOpen size={20} />
                </div>
                <span className="action-tag" style={{ background: 'rgba(62, 207, 207, 0.15)', color: 'var(--accent-secondary)' }}>
                  Bank
                </span>
              </div>
              <div className="action-title">Question Repository</div>
              <p className="action-desc">
                Manage, filter, and import questions categorized by Bloom cognitive levels, difficulty, and course outcomes.
              </p>
            </div>
            <div className="action-footer">
              <span>Explore Questions</span>
              <ArrowRight size={14} />
            </div>
          </Link>

          {/* Action 3: Subjects & Curriculum */}
          <Link to="/subjects" className="action-card">
            <div className="action-card-glow" style={{ background: 'var(--accent-green)' }} />
            <div>
              <div className="action-top">
                <div className="action-icon-box" style={{ background: 'rgba(6, 214, 160, 0.15)', color: 'var(--accent-green)' }}>
                  <Layers size={20} />
                </div>
                <span className="action-tag" style={{ background: 'rgba(6, 214, 160, 0.15)', color: 'var(--accent-green)' }}>
                  Curriculum
                </span>
              </div>
              <div className="action-title">Subject & Outcomes</div>
              <p className="action-desc">
                Define courses, curriculum units, and individual Course Outcomes (CO1 to CO6) for OBE accreditation.
              </p>
            </div>
            <div className="action-footer">
              <span>Configure Courses</span>
              <ArrowRight size={14} />
            </div>
          </Link>

          {/* Action 4: Analytics & Audit */}
          <Link to="/analysis" className="action-card">
            <div className="action-card-glow" style={{ background: 'var(--accent-gold)' }} />
            <div>
              <div className="action-top">
                <div className="action-icon-box" style={{ background: 'rgba(255, 209, 102, 0.15)', color: 'var(--accent-gold)' }}>
                  <BarChart2 size={20} />
                </div>
                <span className="action-tag" style={{ background: 'rgba(255, 209, 102, 0.15)', color: 'var(--accent-gold)' }}>
                  Audit
                </span>
              </div>
              <div className="action-title">Taxonomy & Analytics</div>
              <p className="action-desc">
                Examine Bloom&apos;s level balance, difficulty trends, and detect duplicate or repeated questions.
              </p>
            </div>
            <div className="action-footer">
              <span>View Analytics</span>
              <ArrowRight size={14} />
            </div>
          </Link>
        </div>
      </section>

      {/* ─── Two-Column Analytical Hub ─── */}
      <section className="analytics-hub-grid">
        {/* Left Column: Bloom's Taxonomy Cognitive Spectrum */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <BarChart2 size={18} style={{ color: 'var(--accent-primary)' }} />
                Bloom&apos;s Taxonomy Spectrum
              </div>
              <div className="panel-subtitle">Cognitive level balance across your question bank</div>
            </div>
            <Link to="/analysis" className="btn btn-ghost btn-sm">
              Full Breakdown →
            </Link>
          </div>

          <div className="bloom-stack">
            {BLOOM_LEVELS.map((bloom) => {
              const count = bloomMap[bloom.name.toLowerCase()] || 0;
              const pct = totalQs > 0 ? Math.round((count / totalQs) * 100) : 0;
              const barWidth = Math.max(Math.round((count / maxBloomCount) * 100), count > 0 ? 4 : 0);

              return (
                <div key={bloom.name} className="bloom-bar-row">
                  <div className="bloom-bar-header">
                    <div className="bloom-level-badge">
                      <span className="bloom-color-pip" style={{ background: bloom.color }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{bloom.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({bloom.desc})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{count}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', width: 36, textAlign: 'right' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="bloom-track">
                    <div
                      className="bloom-fill"
                      style={{
                        width: `${barWidth}%`,
                        background: bloom.color,
                        boxShadow: count > 0 ? `0 0 10px ${bloom.color}40` : 'none',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Quick Subjects Directory & System Capabilities */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Layers size={18} style={{ color: 'var(--accent-secondary)' }} />
                Active Subjects Directory
              </div>
              <div className="panel-subtitle">Quick jump to subject questions & exam setup</div>
            </div>
            <Link to="/subjects" className="btn btn-ghost btn-sm">
              All ({subjects.length})
            </Link>
          </div>

          {subjects.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: 12 }}>No subjects registered yet.</p>
              <Link to="/subjects" className="btn btn-secondary btn-sm">
                + Add First Subject
              </Link>
            </div>
          ) : (
            <div className="dash-subject-list">
              {subjects.slice(0, 4).map((sub) => (
                <Link
                  key={sub.id}
                  to={`/generate?subjectId=${sub.id}`}
                  className="dash-subject-item"
                  title={`Generate question paper for ${sub.name}`}
                >
                  <div className="dash-subject-info">
                    <span className="subject-code-pill">{sub.code || 'SUB'}</span>
                    <div>
                      <div className="subject-name-text">{sub.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {sub.department || 'General'} · Sem {sub.semester || 'I'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    Generate →
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* System Capabilities Pill Box */}
          <div className="capability-list">
            <div className="capability-item">
              <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />
              <span>Bloom OBE Matrix</span>
            </div>
            <div className="capability-item">
              <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />
              <span>LaTeX Math Render</span>
            </div>
            <div className="capability-item">
              <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />
              <span>Multi-Part Sections</span>
            </div>
            <div className="capability-item">
              <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />
              <span>Export Vector PDF</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Recent Papers Hub ─── */}
      <section>
        <div className="recent-papers-header">
          <div>
            <div className="section-heading">
              <FileSpreadsheet size={19} style={{ color: 'var(--accent-primary)' }} />
              Recent Question Papers
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Generated examination archives, ready for review and printing
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="search-input-wrap">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search recent papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link to="/history" className="btn btn-ghost btn-sm">
              View All ({recentPapers.length}) →
            </Link>
          </div>
        </div>

        {recentPapers.length === 0 ? (
          <div className="card table-glass">
            <div className="empty-papers-box">
              <div className="empty-icon-glow">
                <FileText size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No Question Papers Generated Yet</h3>
              <p style={{ maxWidth: 460, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Create your first AI-curated question paper with Bloom&apos;s Taxonomy distribution, marks allocation, and instant PDF rendering.
              </p>
              <Link to="/generate" className="btn btn-primary" style={{ marginTop: 8 }}>
                <Sparkles size={16} />
                Generate First Exam Paper
              </Link>
            </div>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="card table-glass" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No papers matching &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <div className="table-glass">
            <table>
              <thead>
                <tr>
                  <th>Paper Title & Details</th>
                  <th>Exam Category</th>
                  <th>Max Marks</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPapers.map((paper) => {
                  const subObj = subjectMap[paper.subject_id];
                  const isDownloading = downloadingId === paper.id;

                  return (
                    <tr key={paper.id}>
                      <td>
                        <div className="paper-title-cell">
                          <div className="paper-title-main">
                            <span>{paper.title}</span>
                          </div>
                          <div className="paper-subject-sub">
                            {subObj ? (
                              <span>
                                {subObj.code ? `${subObj.code} · ` : ''}{subObj.name}
                              </span>
                            ) : (
                              'Standard Subject Paper'
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                          {paper.exam_type || 'Examination'}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-teal" style={{ fontWeight: 700 }}>
                          {paper.total_marks} Marks
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                          <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                          {paper.generated_at
                            ? new Date(paper.generated_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recent'}
                        </div>
                      </td>

                      <td>
                        <div className="action-buttons-cell">
                          <Link
                            to={`/papers/${paper.id}`}
                            className="btn btn-ghost btn-sm"
                            title="Preview and edit paper"
                          >
                            <Eye size={14} />
                            View
                          </Link>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDownloadPDF(paper.id, paper.title)}
                            disabled={isDownloading}
                            title="Download formatted PDF"
                          >
                            {isDownloading ? (
                              <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                            ) : (
                              <Download size={14} />
                            )}
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
