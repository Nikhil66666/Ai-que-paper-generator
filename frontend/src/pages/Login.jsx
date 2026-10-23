import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.access_token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}! 👋`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />

      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">🎓</span>
          <h1>AI Question Paper Generator</h1>
          <p>Sign in to your faculty account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'rgba(239,71,111,0.1)', border: '1px solid rgba(239,71,111,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--accent-red)', fontSize: '0.88rem' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" name="email" placeholder="faculty@university.edu" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password" placeholder="Your password" value={form.password} onChange={handleChange} required />
          </div>

          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Forgot password?</Link>
          </div>

          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Signing in...</> : '🔑 Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register" style={{ fontWeight: 600 }}>Create Account</Link>
        </div>
      </div>
    </div>
  );
}
