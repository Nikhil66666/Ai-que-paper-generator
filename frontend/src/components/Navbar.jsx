import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Sparkles,
  FileText,
  BarChart2,
  GraduationCap,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/subjects', label: 'Subjects', icon: Layers },
  { to: '/questions', label: 'Question Bank', icon: BookOpen },
  { to: '/generate', label: 'Generate', icon: Sparkles },
  { to: '/history', label: 'History', icon: FileText },
  { to: '/analysis', label: 'Analysis', icon: BarChart2 },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/dashboard" className="navbar-logo" style={{ textDecoration: 'none' }}>
          <GraduationCap size={24} style={{ color: 'var(--accent-primary)' }} />
          <span
            style={{
              background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
            }}
          >
            AI QPG
          </span>
        </NavLink>

        <div className="navbar-nav">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <IconComponent size={15} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="navbar-user">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={14} style={{ color: '#ffd166' }} />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={14} style={{ color: '#6c63ff' }} />
                <span>Dark</span>
              </>
            )}
          </button>

          <div className="navbar-avatar" title={user?.name}>
            {initials}
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            title="Sign out"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
