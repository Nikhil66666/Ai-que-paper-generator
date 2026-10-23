import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const features = [
  { icon: '🧠', title: "Bloom's Taxonomy", desc: "Generate questions across all 6 cognitive levels — Remember, Understand, Apply, Analyze, Evaluate, Create." },
  { icon: '🎯', title: 'CO Mapping', desc: 'Automatically map questions to Course Outcomes ensuring complete syllabus coverage.' },
  { icon: '⚖️', title: 'Difficulty Control', desc: 'Precisely set Easy / Medium / Hard ratios for balanced, fair assessments.' },
  { icon: '📊', title: 'Marks Distribution', desc: 'Define sections, marks per question, and total marks. The AI fills everything perfectly.' },
  { icon: '📅', title: 'Previous Year Analysis', desc: 'Detect repeated questions, coverage gaps, and difficulty trends across past papers.' },
  { icon: '📄', title: 'PDF Generation', desc: 'Download a professionally formatted question paper PDF ready for printing.' },
];

const bloomLevels = [
  { level: 'Remember', color: '#ff6b6b', pct: 20 },
  { level: 'Understand', color: '#ff9f1c', pct: 18 },
  { level: 'Apply', color: '#ffd166', pct: 22 },
  { level: 'Analyze', color: '#06d6a0', pct: 15 },
  { level: 'Evaluate', color: '#3ecfcf', pct: 13 },
  { level: 'Create', color: '#6c63ff', pct: 12 },
];

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>

      {/* ─── Top Navbar ─────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-subtle)', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Space Grotesk',sans-serif" }}>
          <span style={{ fontSize: '1.5rem' }}>🎓</span>
          <span style={{ background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Question Paper Generator</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Get Started Free</button>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '100px 24px 80px', textAlign: 'center', overflow: 'hidden' }}>
        {/* Glows */}
        <div style={{ position: 'absolute', width: 700, height: 700, background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, background: 'radial-gradient(circle, rgba(62,207,207,0.08) 0%, transparent 70%)', top: 0, right: '10%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto' }}>
          <div className="badge badge-purple" style={{ marginBottom: 20, padding: '8px 20px', fontSize: '0.85rem' }}>
            ✨ Powered by Google Gemini AI
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem,5vw,4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            Generate{' '}
            <span style={{ background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Smart Question Papers
            </span>
            {' '}in Seconds
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.8 }}>
            The AI-powered tool for faculty — generate perfectly balanced question papers aligned to{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Bloom's Taxonomy</strong>, CO Mapping, difficulty levels, and marks distribution.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
              🚀 Start Generating Free
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>

          {/* Hero Stats */}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
            {[['6','Bloom\'s Levels'], ['3','Difficulty Modes'], ['∞','Questions'], ['PDF','Export Ready']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Space Grotesk',sans-serif", background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bloom Visual ───────────────────────────────── */}
      <section style={{ padding: '60px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Bloom's Taxonomy Visualization</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>Real-time distribution control for every question paper</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {bloomLevels.map(b => (
              <div key={b.level} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', minWidth: 130, textAlign: 'center', transition: 'all 0.25s' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: b.color, fontFamily: "'Space Grotesk',sans-serif" }}>{b.pct}%</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 6 }}>{b.level}</div>
                <div style={{ marginTop: 10, height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${b.pct * 5}%`, maxWidth: '100%', height: '100%', background: b.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2>Everything Faculty Need</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>One platform for all your examination needs</p>
          </div>
          <div className="grid-3" style={{ gap: 24 }}>
            {features.map(f => (
              <div key={f.title} className="card" style={{ padding: '28px 24px' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 14 }}>{f.icon}</div>
                <h4 style={{ marginBottom: 8 }}>{f.title}</h4>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 16 }}>Ready to Transform Your Exam Workflow?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 36 }}>Join faculty members who generate smarter question papers with AI.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
            🎓 Create Free Account
          </button>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        © 2024 AI Question Paper Generator · Built for Faculty Excellence
      </footer>
    </div>
  );
}
