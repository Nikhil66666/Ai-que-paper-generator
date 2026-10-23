import { useEffect, useState, useCallback } from 'react';
import { analysisAPI, subjectAPI } from '../api';
import toast from 'react-hot-toast';

const BLOOM_COLORS = {
  Remember: '#60a5fa',
  Understand: '#34d399',
  Apply: '#f59e0b',
  Analyze: '#ec4899',
  Evaluate: '#8b5cf6',
  Create: '#06d6a0',
};

export default function Analysis() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(true);

  // Analytics data
  const [summary, setSummary] = useState(null);
  const [bloomData, setBloomData] = useState([]);
  const [coData, setCoData] = useState([]);
  const [repeatQuestions, setRepeatQuestions] = useState([]);
  const [difficultyTrend, setDifficultyTrend] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [subsRes, sumRes] = await Promise.all([
        subjectAPI.list(),
        analysisAPI.summary(),
      ]);
      setSubjects(subsRes.data);
      setSummary(sumRes.data);
    } catch {
      toast.error('Failed to load analysis summary');
    }
  };

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const subId = selectedSubjectId ? Number(selectedSubjectId) : undefined;
      const [bloomRes, coRes, repeatRes, diffRes] = await Promise.all([
        analysisAPI.bloomCoverage(subId),
        analysisAPI.coCoverage(subId),
        analysisAPI.repeatQuestions(subId),
        analysisAPI.difficultyTrend(subId),
      ]);

      setBloomData(bloomRes.data?.data || []);
      setCoData(coRes.data?.data || []);
      setRepeatQuestions(repeatRes.data?.data || []);
      setDifficultyTrend(diffRes.data?.data || []);
    } catch {
      toast.error('Failed to fetch detailed analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const maxCOCount = Math.max(...coData.map((c) => c.count), 1);

  return (
    <div className="container" style={{ padding: '2rem 1rem 5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
            📊 Faculty Analytics & Insights
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Evaluate Bloom&apos;s taxonomy distribution, Course Outcome (CO) attainment coverage, and previous year repetition trends.
          </p>
        </div>

        {/* Subject Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Filter Subject:
          </label>
          <select
            className="select"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            style={{ width: '220px' }}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Stat Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>TOTAL QUESTIONS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-light)' }}>
              {summary.total_questions || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Across {summary.total_subjects || 0} subjects
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>PAPERS GENERATED</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)' }}>
              {summary.total_papers || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Ready for examination
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>AI QUESTIONS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>
              {summary.ai_generated_questions || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Synthesized with Gemini
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>MANUAL BANK QUESTIONS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#06d6a0' }}>
              {summary.manual_questions || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Curated by faculty
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '30px', height: '30px' }} />
          Computing analytical metrics...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* Bloom's Taxonomy Distribution Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🎯</span> Bloom&apos;s Taxonomy Coverage
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Percentage breakdown of cognitive levels present in the question bank.
            </p>

            {bloomData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                No questions found with Bloom levels for this selection.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bloomData.map((item) => (
                  <div key={item.bloom_level}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>{item.bloom_level}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {item.count} questions ({item.percentage}%)
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{
                      width: '100%',
                      height: '10px',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '5px',
                      overflow: 'hidden',
                    }}>
                      <div
                        style={{
                          width: `${item.percentage}%`,
                          height: '100%',
                          background: BLOOM_COLORS[item.bloom_level] || 'var(--primary)',
                          borderRadius: '5px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Course Outcome (CO) Distribution Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📐</span> Course Outcome (CO) Distribution
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Question frequency mapped across individual course outcomes.
            </p>

            {coData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                No questions tagged with COs yet. Add CO tags in the Question Bank.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {coData.map((co) => {
                  const pct = Math.round((co.count / maxCOCount) * 100);
                  return (
                    <div key={co.co_number}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{co.co_number}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {co.count} questions
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '5px',
                        overflow: 'hidden',
                      }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'var(--secondary)',
                            borderRadius: '5px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Previous Year Repeated Questions */}
          <div className="card" style={{ gridColumn: '1 / -1', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔁</span> Frequently Repeated Exam Questions
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Questions that have appeared in 2 or more generated papers (useful for previous year frequency analysis).
            </p>

            {repeatQuestions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                No repeated questions flagged yet. As you generate more exam papers, frequently chosen questions will be highlighted here.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Question Text</th>
                      <th>Bloom Level</th>
                      <th>CO</th>
                      <th style={{ textAlign: 'center' }}>Times Repeated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repeatQuestions.map((q, idx) => (
                      <tr key={idx}>
                        <td style={{ maxWidth: '400px' }}>{q.question_text}</td>
                        <td>
                          <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                            {q.bloom_level || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                            {q.co_number || 'N/A'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            background: 'rgba(239, 71, 111, 0.2)',
                            color: 'var(--danger)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}>
                            {q.repeat_count}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Previous Year Difficulty Trends */}
          {difficultyTrend.length > 0 && (
            <div className="card" style={{ gridColumn: '1 / -1', padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📈</span> Difficulty Trend by Academic Year
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Year-over-year difficulty evolution in previous question papers.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Academic Year</th>
                      <th>Easy Questions</th>
                      <th>Medium Questions</th>
                      <th>Hard Questions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {difficultyTrend.map((row) => (
                      <tr key={row.year}>
                        <td><strong>{row.year}</strong></td>
                        <td style={{ color: '#06d6a0' }}>{row.difficulties?.Easy || 0}</td>
                        <td style={{ color: '#f59e0b' }}>{row.difficulties?.Medium || 0}</td>
                        <td style={{ color: '#ef476f' }}>{row.difficulties?.Hard || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
