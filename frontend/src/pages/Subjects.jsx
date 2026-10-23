import { useEffect, useState } from 'react';
import { subjectAPI } from '../api';
import toast from 'react-hot-toast';

const BLOOM_LEVELS = ['Remember','Understand','Apply','Analyze','Evaluate','Create'];

function SubjectModal({ subject, onClose, onSave }) {
  const [form, setForm] = useState(subject || { name:'', code:'', semester:'', department:'', description:'' });
  const [loading, setLoading] = useState(false);
  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      if (subject) { await subjectAPI.update(subject.id, form); toast.success('Subject updated!'); }
      else { await subjectAPI.create(form); toast.success('Subject created!'); }
      onSave();
    } catch { toast.error('Operation failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{subject ? '✏️ Edit Subject' : '➕ Add Subject'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="grid-2" style={{ gap:14 }}>
            <div className="form-group">
              <label className="form-label">Subject Name *</label>
              <input className="form-input" name="name" value={form.name} onChange={change} required />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Code</label>
              <input className="form-input" name="code" value={form.code} onChange={change} placeholder="CS301" />
            </div>
          </div>
          <div className="grid-2" style={{ gap:14 }}>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <input className="form-input" name="semester" value={form.semester} onChange={change} placeholder="3rd Semester" />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" name="department" value={form.department} onChange={change} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" name="description" value={form.description} onChange={change} rows={3} />
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Subject'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function COModal({ subject, onClose, onSave }) {
  const [cos, setCos] = useState([]);
  const [form, setForm] = useState({ co_number:'', description:'', bloom_level:'' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    subjectAPI.listCOs(subject.id).then(r => setCos(r.data)).finally(() => setFetching(false));
  }, [subject.id]);

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const addCO = async e => {
    e.preventDefault(); setLoading(true);
    try {
      await subjectAPI.createCO(subject.id, form);
      const r = await subjectAPI.listCOs(subject.id); setCos(r.data);
      setForm({ co_number:'', description:'', bloom_level:'' });
      toast.success('CO added!'); onSave();
    } catch { toast.error('Failed to add CO.'); }
    finally { setLoading(false); }
  };

  const deleteCO = async id => {
    if (!confirm('Delete this CO?')) return;
    await subjectAPI.deleteCO(subject.id, id);
    setCos(c => c.filter(x => x.id !== id));
    toast.success('CO deleted.'); onSave();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:620 }}>
        <div className="modal-header">
          <span className="modal-title">🎯 Course Outcomes — {subject.name}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {fetching ? <div className="flex-center" style={{ padding:20 }}><div className="spinner"/></div> : (
          <>
            {cos.length > 0 && (
              <div style={{ marginBottom:20, display:'flex', flexDirection:'column', gap:8 }}>
                {cos.map(co => (
                  <div key={co.id} style={{ display:'flex', alignItems:'center', gap:10, background:'var(--bg-input)', borderRadius:'var(--radius-md)', padding:'10px 14px' }}>
                    <span className="badge badge-purple">{co.co_number}</span>
                    <span style={{ flex:1, fontSize:'0.88rem', color:'var(--text-secondary)' }}>{co.description}</span>
                    {co.bloom_level && <span className={`badge bloom-${co.bloom_level.toLowerCase()}`}>{co.bloom_level}</span>}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteCO(co.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <hr className="divider" />
            <p className="form-label" style={{ marginBottom:12 }}>Add New CO</p>
            <form onSubmit={addCO} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="grid-2" style={{ gap:12 }}>
                <div className="form-group">
                  <label className="form-label">CO Number *</label>
                  <input className="form-input" name="co_number" value={form.co_number} onChange={change} placeholder="CO1" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Bloom Level</label>
                  <select className="form-select" name="bloom_level" value={form.bloom_level} onChange={change}>
                    <option value="">Select...</option>
                    {BLOOM_LEVELS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="form-input" name="description" value={form.description} onChange={change} placeholder="Students will be able to..." required />
              </div>
              <button type="submit" className="btn btn-teal" disabled={loading}>{loading ? 'Adding...' : '+ Add CO'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [showCO, setShowCO] = useState(null);

  const fetch = () => { setLoading(true); subjectAPI.list().then(r => setSubjects(r.data)).finally(() => setLoading(false)); };
  useEffect(fetch, []);

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject and all its data?')) return;
    await subjectAPI.delete(id);
    setSubjects(s => s.filter(x => x.id !== id));
    toast.success('Subject deleted.');
  };

  return (
    <div className="container page">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">📚 Subjects</h1>
          <p className="page-subtitle">Manage your subjects and course outcomes</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditSubject(null); setShowModal(true); }}>+ Add Subject</button>
      </div>

      {loading ? <div className="loading-page"><div className="spinner"/></div> :
       subjects.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No subjects yet</h3><p>Add your first subject to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Subject</button>
        </div></div>
       ) : (
        <div className="grid-3" style={{ gap:20 }}>
          {subjects.map(s => (
            <div key={s.id} className="card card-glow">
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <h4 style={{ marginBottom:4 }}>{s.name}</h4>
                  {s.code && <span className="badge badge-teal" style={{ fontSize:'0.72rem' }}>{s.code}</span>}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditSubject(s); setShowModal(true); }}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteSubject(s.id)}>🗑️</button>
                </div>
              </div>
              {s.semester && <p style={{ fontSize:'0.83rem', color:'var(--text-muted)', marginBottom:4 }}>📅 {s.semester}</p>}
              {s.department && <p style={{ fontSize:'0.83rem', color:'var(--text-muted)', marginBottom:8 }}>🏛️ {s.department}</p>}
              <hr className="divider" style={{ margin:'12px 0' }}/>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{s.course_outcomes?.length || 0} Course Outcomes</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowCO(s)}>🎯 Manage COs</button>
              </div>
            </div>
          ))}
        </div>
       )
      }

      {showModal && <SubjectModal subject={editSubject} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetch(); }} />}
      {showCO && <COModal subject={showCO} onClose={() => setShowCO(null)} onSave={fetch} />}
    </div>
  );
}
