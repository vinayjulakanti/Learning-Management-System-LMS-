import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_MODE } from '../config';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, User, Hash, Building2, BookOpen, GraduationCap, Calendar, MapPin, Sun, Moon, Phone } from 'lucide-react';
import './register.css';
import './login.css'; // Import login.css to share input/form/button styles

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('student'); // 'student' | 'teacher'
  const [form, setForm] = useState({ 
    name: '', email: '', rollNo: '', teacherId: '', countryCode: '+1', mobileNumber: '', password: '', confirmPassword: ''
  });
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
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

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };
  const pScore = getPasswordStrength(form.password);
  
  const hasMinLength = form.password.length >= 8;
  const hasUpper = /[A-Z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(form.password);



  const onSubmit = async (e) => {
    e.preventDefault();
    if (DEMO_MODE) return;
    setError('');
    if (!hasMinLength) return setError('Password must be at least 8 characters long');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (tab === 'teacher' && !/^\d{10}$/.test(form.teacherId)) {
      return setError('Instructor ID must be exactly 10 digits');
    }
    
    setLoading(true);
    try {
      const role = tab === 'teacher' ? 'teacher' : 'student';
      const payload = { 
        ...form, 
        role,
        mobileNumber: `${form.countryCode} ${form.mobileNumber}`
      };
      await register(payload);
      nav('/login');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="register-layout">
      {/* Theme Toggle */}
      <button onClick={toggleTheme} style={{
        position: 'absolute', top: '24px', left: '24px', zIndex: 100,
        background: 'var(--panel)', border: '1px solid var(--border)',
        borderRadius: '50%', width: '40px', height: '40px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--text)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Decorative Hero Left Side */}
      <div className="register-hero fade-in-up" aria-hidden="true">
        <div style={{ position: 'absolute', zIndex: 10, padding: '0 40px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'white',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10B981',
            fontWeight: '900',
            fontSize: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            marginBottom: '32px'
          }}>
            <BookOpen size={36} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '16px', lineHeight: 1.1 }}>
            Join Lumina<br/>and <span style={{ color: 'var(--text)', textShadow: '0 2px 4px rgba(255,255,255,0.2)' }}>elevate</span><br/>your skills.
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '440px', lineHeight: 1.6 }}>
            Create an account to access interactive courses, connect with peers, and track your development.
          </p>
          
          <div className="hero-features" style={{marginTop: '40px'}}>
            <div className="hero-feature-item">
              <div className="hero-feature-icon" style={{background: 'rgba(255,255,255,0.25)'}}><CheckCircle2 size={20} color="white" /></div>
              1200+ Interactive Courses
            </div>
            <div className="hero-feature-item">
              <div className="hero-feature-icon" style={{background: 'rgba(255,255,255,0.25)'}}><CheckCircle2 size={20} color="white" /></div>
              AI Learning Assistant
            </div>
            <div className="hero-feature-item">
              <div className="hero-feature-icon" style={{background: 'rgba(255,255,255,0.25)'}}><CheckCircle2 size={20} color="white" /></div>
              Peer Collaboration Network
            </div>
          </div>
        </div>
      </div>

      {/* Form Right Side */}
      <div className="register-right fade-in-up">
        <div className="register-panel">
          <h2>Create Account</h2>
          
          <div className="segmented-control">
            <div className={`segment-indicator ${tab === 'teacher' ? 'teacher' : ''}`}></div>
            <button type="button" className={`segment-btn ${tab==='student'?'active':''}`} onClick={()=>{setTab('student');}}>Student</button>
            <button type="button" className={`segment-btn ${tab==='teacher'?'active':''}`} onClick={()=>{setTab('teacher');}}>Instructor</button>
          </div>



          {error && <div className="alert danger fade-in-up" style={{marginBottom: '24px', padding: '12px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', fontSize: '0.9rem'}}>{error}</div>}

          {DEMO_MODE && (
            <div style={{textAlign:'center', marginBottom: '16px'}} className="muted">Demo mode on — registration disabled</div>
          )}

          {!DEMO_MODE && (
            <form className="form" onSubmit={onSubmit}>
              
              <div className="fade-in-up">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label>Full Name</label>
                    <div className="input-group">
                      <User className="input-icon" size={18} />
                      <input className="input rounded" name="name" value={form.name} onChange={onChange} placeholder="Enter your name" required />
                    </div>
                  </div>
                  <div>
                    {tab === 'student' ? (
                      <>
                        <label>Roll Number (Required)</label>
                        <div className="input-group">
                          <Hash className="input-icon" size={18} />
                          <input className="input rounded" name="rollNo" value={form.rollNo} onChange={onChange} placeholder="Roll Number" maxLength={10} required />
                        </div>
                      </>
                    ) : (
                      <>
                        <label>Instructor ID (10 digits)</label>
                        <div className="input-group">
                          <Hash className="input-icon" size={18} />
                          <input className="input rounded" name="teacherId" value={form.teacherId} onChange={onChange} placeholder="ID for verification" maxLength={10} required />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label>Email Address</label>
                    <div className="input-group">
                      <Mail className="input-icon" size={18} />
                      <input className="input rounded" name="email" value={form.email} onChange={onChange} type="email" placeholder="Enter your email" required />
                    </div>
                  </div>
                  <div>
                    <label>Mobile Number</label>
                    <div className="input-group" style={{ display: 'flex' }}>
                      <Phone className="input-icon" size={18} style={{ zIndex: 10 }} />
                      <select name="countryCode" value={form.countryCode} onChange={onChange} className="input rounded" style={{ width: '100px', paddingLeft: '40px', paddingRight: '8px', borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0, backgroundColor: 'var(--panel)', cursor: 'pointer' }}>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+91">+91 (IN)</option>
                        <option value="+61">+61 (AU)</option>
                      </select>
                      <input className="input rounded" name="mobileNumber" value={form.mobileNumber} onChange={onChange} type="tel" placeholder="Enter your number" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, paddingLeft: '16px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label>Password</label>
                  <div className="input-group password-field">
                    <Lock className="input-icon" size={18} />
                    <input className="input rounded" name="password" value={form.password} onChange={onChange} type={show? 'text':'password'} placeholder="Create a password (min. 8 chars)" required />
                    <button type="button" className="eye" onClick={()=>setShow(s=>!s)} aria-label={show? 'Hide password':'Show password'}>
                      {show ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                  
                  {form.password.length > 0 && (
                    <>
                      <div className="password-meter fade-in-up" style={{animationDuration: '0.3s'}}>
                        <div className={`meter-segment ${pScore >= 1 ? (pScore < 3 ? 'active-weak' : (pScore < 4 ? 'active-fair' : 'active-good')) : ''}`}></div>
                        <div className={`meter-segment ${pScore >= 2 ? (pScore < 3 ? 'active-weak' : (pScore < 4 ? 'active-fair' : 'active-good')) : ''}`}></div>
                        <div className={`meter-segment ${pScore >= 3 ? (pScore < 4 ? 'active-fair' : 'active-good') : ''}`}></div>
                        <div className={`meter-segment ${pScore >= 4 ? 'active-good' : ''}`}></div>
                      </div>
                      <div className="password-checks fade-in-up">
                        <div className={`check-item ${hasMinLength ? 'valid' : ''}`}>
                          <CheckCircle2 size={14} /> 8+ Characters
                        </div>
                        <div className={`check-item ${hasUpper ? 'valid' : ''}`}>
                          <CheckCircle2 size={14} /> Uppercase Letter
                        </div>
                        <div className={`check-item ${hasNumber ? 'valid' : ''}`}>
                          <CheckCircle2 size={14} /> Number
                        </div>
                        <div className={`check-item ${hasSpecial ? 'valid' : ''}`}>
                          <CheckCircle2 size={14} /> Special Character
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ marginBottom: '16px', marginTop: '16px' }}>
                  <label>Confirm Password</label>
                  <div className="input-group password-field">
                    <Lock className="input-icon" size={18} />
                    <input className="input rounded" name="confirmPassword" value={form.confirmPassword} onChange={onChange} type={show2? 'text':'password'} placeholder="Repeat your password" required />
                    <button type="button" className="eye" onClick={()=>setShow2(s=>!s)} aria-label={show2? 'Hide password':'Show password'}>
                      {show2 ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '32px' }}>
                <button type="submit" className="pill primary" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Processing...' : 'Create Account'}
                </button>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </div>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.95rem' }}>
            <span style={{color: 'var(--text)', fontWeight: '500'}}>Already have an account?</span>{' '}
            <Link to="/login" style={{ fontWeight: '800', color: 'var(--primary)', textDecoration: 'underline' }}>Log in</Link>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer fade-in-up" style={{animationDelay: '0.2s', paddingBottom: '24px'}}>
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Help</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </div>
  );
}
