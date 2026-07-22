import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_MODE } from '../config';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, Star, Users, BookOpen, GraduationCap, Sun, Moon } from 'lucide-react';
import './login.css';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    return savedTheme === 'dark';
  });

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    setIsDark(savedTheme === 'dark');
    if (savedTheme === 'dark') {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    const themeStr = newTheme ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeStr);
    if (newTheme) {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
    }
    localStorage.setItem('theme', themeStr);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (DEMO_MODE) return;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      nav('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };
  const pScore = getPasswordStrength(password);

  return (
    <div className="login-layout">
      {/* Theme Toggle */}
      <button onClick={toggleTheme} style={{
        position: 'absolute', top: '24px', right: '24px', zIndex: 100,
        background: 'var(--panel)', border: '1px solid var(--border)',
        borderRadius: '50%', width: '40px', height: '40px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--text)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Decorative Hero Left Side */}
      <div className="login-hero" aria-hidden="true">
        <div className="fade-in-up" style={{ zIndex: 10, position: 'relative' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'white',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4F46E5',
            marginBottom: '32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <GraduationCap size={36} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '24px', lineHeight: 1.1 }}>
            Welcome back<br/>to <span style={{ color: 'rgba(255,255,255,0.9)' }}>Lumina.</span>
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '440px', lineHeight: 1.6 }}>
            Sign in to continue your learning journey, track your progress, and collaborate with peers.
          </p>

          <div className="hero-features">
            <div className="hero-feature-item">
              <div className="hero-feature-icon"><CheckCircle2 size={20} color="white" /></div>
              Interactive Courses & Labs
            </div>
            <div className="hero-feature-item">
              <div className="hero-feature-icon"><CheckCircle2 size={20} color="white" /></div>
              Real-Time Analytics Dashboard
            </div>
            <div className="hero-feature-item">
              <div className="hero-feature-icon"><CheckCircle2 size={20} color="white" /></div>
              Verified Certificates
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value" style={{display:'flex', alignItems:'center', gap:'8px'}}>
                4.9/5 <Star size={24} fill="#FCD34D" color="#FCD34D" />
              </div>
              <div className="stat-label">Trusted Rating</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">50K+</div>
              <div className="stat-label">Active Learners</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Right Side */}
      <div className="login-right fade-in-up">
        <div className="login-panel">
          <h2>Log In</h2>
          <p className="subtitle">Enter your credentials to access your account.</p>
          
          {error && <div className="alert danger fade-in-up" style={{marginBottom: '24px', padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', fontSize: '0.9rem'}}>{error}</div>}
          
          {!DEMO_MODE && (
            <form className="form" onSubmit={onSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label>Email Address</label>
                <div className="input-group">
                  <Mail className="input-icon" size={20} />
                  <input className="input rounded" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="you@example.com" required />
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label>Password</label>
                <div className="input-group password-field" style={{marginBottom: '4px'}}>
                  <Lock className="input-icon" size={20} />
                  <input className="input rounded" value={password} onChange={(e)=>setPassword(e.target.value)} type={show? 'text':'password'} placeholder="••••••••" required />
                  <button type="button" className="eye" onClick={()=>setShow(s=>!s)} aria-label={show? 'Hide password':'Show password'}>
                    {show ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                
                {password.length > 0 && (
                  <div className="password-meter fade-in-up" style={{animationDuration: '0.3s'}}>
                    <div className={`meter-segment ${pScore >= 1 ? (pScore < 3 ? 'active-weak' : (pScore < 4 ? 'active-fair' : 'active-good')) : ''}`}></div>
                    <div className={`meter-segment ${pScore >= 2 ? (pScore < 3 ? 'active-weak' : (pScore < 4 ? 'active-fair' : 'active-good')) : ''}`}></div>
                    <div className={`meter-segment ${pScore >= 3 ? (pScore < 4 ? 'active-fair' : 'active-good') : ''}`}></div>
                    <div className={`meter-segment ${pScore >= 4 ? 'active-good' : ''}`}></div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <Link to="/forgot" className="forgot">Forgot password?</Link>
              </div>

              <button className="pill primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {DEMO_MODE && (
            <div style={{textAlign:'center'}} className="muted">Demo mode on — authentication disabled</div>
          )}

          <div className="or">or continue with</div>

          <div className="socials">
            <button className="social-btn google" type="button" onClick={()=>{ window.location.href = '/api/auth/google/start'; }}>
              <svg className="icon" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C32.9 6.1 28.7 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.5-8 19.5-20 0-1.2-.1-2.1-.3-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.2 19 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C32.9 6.1 28.7 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c4.6 0 8.9-1.8 12-4.7l-5.5-4.5c-1.7 1.3-3.9 2.2-6.5 2.2-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3 5.1-5.8 6.8l5.5 4.5C37.7 36.9 40 31.9 40 26c0-1.2-.1-2.1-.4-3.5z"/>
              </svg>
              Google
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.95rem' }}>
            <span style={{color: 'var(--text)', fontWeight: '500'}}>Don't have an account?</span>{' '}
            <Link to="/register" style={{ fontWeight: '800', color: 'var(--primary)', textDecoration: 'underline' }}>Sign up</Link>
          </div>
        </div>
        
        {/* Footer */}
        <div className="auth-footer fade-in-up" style={{animationDelay: '0.2s'}}>
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Help</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </div>
  );
}
