import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('OTP sent to your email!');
      setTimeout(() => navigate('/verify-otp', { state: { email, purpose: 'reset' } }), 1500);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo">
          <span className="auth-logo-icon">🔑</span>
          <h1>Forgot Password?</h1>
          <p>Enter your email address and we'll send you a reset OTP.</p>
        </div>
        {sent ? (
          <div style={{ color: 'var(--accent-green)', background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.3)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            ✅ OTP sent! Redirecting to verification...
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="faculty@university.edu" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Sending OTP...</> : '📧 Send Reset OTP'}
            </button>
          </form>
        )}
        <div className="auth-footer">
          <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
