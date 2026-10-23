import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { paperAPI } from '../api';
import toast from 'react-hot-toast';

export default function History() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const res = await paperAPI.list();
      setPapers(res.data);
    } catch {
      toast.error('Failed to load papers history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this paper?')) return;
    try {
      await paperAPI.delete(id);
      setPapers(papers.filter((p) => p.id !== id));
      toast.success('Paper deleted');
    } catch {
      toast.error('Failed to delete paper');
    }
  };

  const filteredPapers = papers.filter((p) =>
    (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.exam_type || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
            📜 Generated Papers History
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Browse, preview, reprint, and download all your previously generated question papers.
          </p>
        </div>
        <Link to="/generate" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>✨</span> Generate New Paper
        </Link>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
        <input
          type="text"
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search papers by title or exam type..."
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '30px', height: '30px' }} />
          Loading papers history...
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <h3 style={{ marginBottom: '0.5rem' }}>
            {search ? 'No matching papers found' : 'No question papers generated yet'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            {search
              ? 'Try changing your search query to find your question paper.'
              : 'Create your first AI-balanced question paper using our automated Bloom taxonomy & CO generator.'}
          </p>
          {!search && (
            <Link to="/generate" className="btn btn-primary">
              Generate Your First Paper
            </Link>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Paper Title</th>
                <th>Exam Type</th>
                <th>Total Marks</th>
                <th>Generated Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPapers.map((paper) => (
                <tr key={paper.id}>
                  <td>
                    <Link
                      to={`/papers/${paper.id}`}
                      style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.target.style.color = 'var(--primary-light)')}
                      onMouseLeave={(e) => (e.target.style.color = 'var(--text-primary)')}
                    >
                      {paper.title}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-secondary" style={{ fontSize: '0.775rem' }}>
                      {paper.exam_type || 'Exam'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--secondary)' }}>{paper.total_marks} M</strong>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {new Date(paper.generated_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <Link
                        to={`/papers/${paper.id}`}
                        className="btn btn-ghost"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                      >
                        👁️ View
                      </Link>
                      <button
                        onClick={() => {
                          toast.loading('Preparing PDF...', { id: `pdf-${paper.id}` });
                          paperAPI.downloadPDF(paper.id, paper.title)
                            .then(() => toast.success('PDF downloaded!', { id: `pdf-${paper.id}` }))
                            .catch(() => toast.error('Failed to download PDF', { id: `pdf-${paper.id}` }));
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                      >
                        📥 PDF
                      </button>
                      <button
                        onClick={() => handleDelete(paper.id)}
                        className="btn btn-ghost"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', color: 'var(--danger)' }}
                        title="Delete Paper"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
