import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthAPI } from '../api/client';
import './forgot.css';

export default function ForgotPassword(){
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email'); return; }
    try {
      setLoading(true);
      const { data } = await AuthAPI.forgot({ email });
      // optional: data.resetUrl from backend useful in dev
      setSent(true);
    } catch (e) {
      setError('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-layout">
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="forgot-panel card">
        <h2 style={{textAlign:'center', marginTop:0}}>Reset password</h2>
        <p className="muted" style={{marginTop:8, marginBottom:16, textAlign:'center'}}>
          Enter your user name to reset your password. You will receive an instruction to the Email ID associated with the user name.
        </p>
        {error && <div className="alert danger" style={{marginBottom:12}}>{error}</div>}
        {sent ? (
          <div className="alert" style={{marginBottom:12}}>If an account exists for {email}, a reset link has been sent.</div>
        ) : (
          <form className="form" onSubmit={onSubmit}>
            <label>Email ID</label>
            <input className="input rounded" type="email" placeholder="Enter your email id here" value={email} onChange={e=>setEmail(e.target.value)} required />
            <button className="pill primary" disabled={loading}>{loading? 'Sending…':'Send reset link'}</button>
          </form>
        )}
        <div style={{textAlign:'center', marginTop:12}}>
          <Link to="/login">All login options</Link>
        </div>
      </div>
    </div>
  );
}
