import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function VerifyOTP() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const purpose = location.state?.purpose || 'verify'; // 'verify' | 'reset'

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const refs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/register');
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleInput = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d)) handleVerify(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async (code) => {
    if (!code) code = otp.join('');
    if (code.length !== 6) return;
    setLoading(true); setError('');
    try {
      if (purpose === 'reset') {
        navigate('/reset-password', { state: { email, otp: code } });
        return;
      }
      const res = await authAPI.verifyOTP({ email, otp: code });
      login(res.data.access_token, res.data.user);
      toast.success('Email verified! Welcome 🎉');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendOTP({ email });
      toast.success('New OTP sent to your email!');
      setTimer(60); setOtp(['', '', '', '', '', '']); setError('');
      refs.current[0]?.focus();
    } catch {
      toast.error('Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />

      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo">
          <span className="auth-logo-icon">📧</span>
          <h1>Verify Your Email</h1>
          <p>Enter the 6-digit OTP sent to<br /><strong style={{ color: 'var(--accent-primary)' }}>{email}</strong></p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,71,111,0.1)', border: '1px solid rgba(239,71,111,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--accent-red)', fontSize: '0.88rem', marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        <div className="otp-inputs">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={el => refs.current[i] = el}
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
            />
          ))}
        </div>

        <button
          className="btn btn-primary btn-lg btn-full"
          onClick={() => handleVerify()}
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Verifying...</> : '✅ Verify OTP'}
        </button>

        <div style={{ marginTop: 20, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {timer > 0
            ? <>Resend OTP in <strong style={{ color: 'var(--accent-primary)' }}>{timer}s</strong></>
            : <button className="btn btn-ghost btn-sm" onClick={handleResend} disabled={resending}>{resending ? 'Sending...' : '🔄 Resend OTP'}</button>
          }
        </div>

        <div className="auth-footer">
          <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
