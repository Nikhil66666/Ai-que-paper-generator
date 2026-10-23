import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Questions from './pages/Questions';
import GeneratePaper from './pages/GeneratePaper';
import PaperPreview from './pages/PaperPreview';
import History from './pages/History';
import Analysis from './pages/Analysis';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
              success: { iconTheme: { primary: '#06d6a0', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef476f', secondary: '#fff' } },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/verify-otp"      element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* Protected */}
            <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
            <Route path="/subjects"  element={<PrivateRoute><AppLayout><Subjects /></AppLayout></PrivateRoute>} />
            <Route path="/questions" element={<PrivateRoute><AppLayout><Questions /></AppLayout></PrivateRoute>} />
            <Route path="/generate"  element={<PrivateRoute><AppLayout><GeneratePaper /></AppLayout></PrivateRoute>} />
            <Route path="/papers/:id" element={<PrivateRoute><AppLayout><PaperPreview /></AppLayout></PrivateRoute>} />
            <Route path="/history"   element={<PrivateRoute><AppLayout><History /></AppLayout></PrivateRoute>} />
            <Route path="/analysis"  element={<PrivateRoute><AppLayout><Analysis /></AppLayout></PrivateRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
