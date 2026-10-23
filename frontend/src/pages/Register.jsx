import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', department: '', institution: '', designation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      await authAPI.register({ name: form.name, email: form.email, password: form.password, department: form.department, institution: form.institution, designation: form.designation });
      toast.success('Account created! Check your email for OTP.');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />

      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <span className="auth-logo-icon">🎓</span>
          <h1>Create Faculty Account</h1>
          <p>Join to start generating AI question papers</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'rgba(239,71,111,0.1)', border: '1px solid rgba(239,71,111,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--accent-red)', fontSize: '0.88rem' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="grid-2" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" name="name" placeholder="Dr. John Smith" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-input" name="designation" placeholder="Assistant Professor" value={form.designation} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" name="email" placeholder="faculty@university.edu" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Institution</label>
            <input className="form-input" name="institution" placeholder="MIT / IIT Bombay" value={form.institution} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-input" name="department" placeholder="Computer Science & Engineering" value={form.department} onChange={handleChange} />
          </div>

          <div className="grid-2" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" name="password" placeholder="Min 8 characters" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input className="form-input" type="password" name="confirm" placeholder="Repeat password" value={form.confirm} onChange={handleChange} required />
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating Account...</> : '✨ Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
