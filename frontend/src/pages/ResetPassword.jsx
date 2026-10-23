import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const prefillOtp = location.state?.otp || '';

  const [form, setForm] = useState({ otp: prefillOtp, new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.new_password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp: form.otp, new_password: form.new_password });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. Check your OTP.');
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
          <span className="auth-logo-icon">🔒</span>
          <h1>Reset Password</h1>
          <p>Create a new secure password for<br /><strong style={{ color: 'var(--accent-primary)' }}>{email}</strong></p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'rgba(239,71,111,0.1)', border: '1px solid rgba(239,71,111,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--accent-red)', fontSize: '0.88rem' }}>
              ⚠️ {error}
            </div>
          )}
          {!prefillOtp && (
            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input className="form-input" name="otp" placeholder="6-digit OTP" value={form.otp} onChange={handleChange} maxLength={6} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" name="new_password" placeholder="Min 8 characters" value={form.new_password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" name="confirm" placeholder="Repeat new password" value={form.confirm} onChange={handleChange} required />
          </div>
          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Resetting...</> : '🔒 Reset Password'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
