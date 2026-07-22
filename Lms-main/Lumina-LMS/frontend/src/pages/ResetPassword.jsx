import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthAPI } from '../api/client';
import './forgot.css';

export default function ResetPassword(){
  const [params] = useSearchParams();
  const token = useMemo(()=>params.get('token')||'', [params]);
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) { setError('Invalid or missing token'); return; }
    if ((password||'').length < 8) { setError('Password must be at least 8 characters long'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    try {
      setLoading(true);
      await AuthAPI.reset({ token, password });
      setSuccess(true);
      setTimeout(()=>nav('/login'), 1200);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  const onSendLink = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email'); return; }
    try {
      setLoading(true);
      const { data } = await AuthAPI.forgot({ email });
      setSent(true);
    } catch (e) {
      setError('Failed to send reset link');
    } finally { setLoading(false); }
  };

  return (
    <div className="forgot-layout">
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="forgot-panel card">
        <h2 style={{textAlign:'center', marginTop:0}}>{token ? 'Set a new password' : 'Reset your password'}</h2>
        {error && <div className="alert danger" style={{marginBottom:12}}>{error}</div>}
        {success && <div className="alert" style={{marginBottom:12}}>Password changed. Redirecting to login…</div>}
        {!success && token && (
          <form className="form" onSubmit={onSubmit}>
            <label>Create password</label>
            <div className="password-field">
              <input className="input rounded" type={show1?'text':'password'} placeholder="Create password" value={password} onChange={e=>setPassword(e.target.value)} required />
              <button type="button" className="eye" onClick={()=>setShow1(s=>!s)} aria-label={show1? 'Hide password':'Show password'}>{show1?'🙈':'👁️'}</button>
            </div>
            <label>Confirm password</label>
            <div className="password-field">
              <input className="input rounded" type={show2?'text':'password'} placeholder="Confirm password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
              <button type="button" className="eye" onClick={()=>setShow2(s=>!s)} aria-label={show2? 'Hide password':'Show password'}>{show2?'🙈':'👁️'}</button>
            </div>
            <button className="pill primary" disabled={loading}>{loading? 'Saving…':'Submit'}</button>
          </form>
        )}
        {!success && !token && (
          <form className="form" onSubmit={onSendLink}>
            <p className="muted" style={{marginTop:0}}>Enter your email to receive a password reset link.</p>
            <label>Email ID</label>
            <input className="input rounded" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
            <button className="pill primary" disabled={loading}>{loading? 'Sending…':'Send reset link'}</button>
            {sent && <div className="alert" style={{marginTop:12}}>If an account exists, a reset link has been sent.</div>}
          </form>
        )}
        <div style={{textAlign:'center', marginTop:12}}>
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
