import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DEMO_MODE } from '../config';
import { AuthAPI } from '../api/client';

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  if (DEMO_MODE) {
    return (
      <div className="container">
        <div className="card" style={{maxWidth: 520, margin: '40px auto'}}>
          <h2>Admin Login (Demo)</h2>
          <p className="muted">Demo mode is on. Open the dashboard directly.</p>
          <div style={{display:'flex', gap:10}}>
            <Link to="/admin" className="btn primary">Open Admin Dashboard</Link>
            <Link to="/" className="btn">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const { data } = await AuthAPI.login({ email, password });
      // Ensure admin role
      const role = String(data?.user?.role || '').toLowerCase();
      if (role !== 'admin') {
        setErr('Access denied: not an admin account');
        setLoading(false);
        return;
      }
      // Persist token for global API usage
      sessionStorage.setItem('token', data.token);
      // Navigate to admin dashboard
      nav('/admin', { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{maxWidth: 480, margin: '40px auto'}}>
        <h2>Admin Login</h2>
        {err && <div className="alert danger" style={{marginBottom:12}}>{err}</div>}
        <form className="form" onSubmit={onSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="admin@example.com" required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" required />
          <button className="btn primary" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
        </form>
        <div style={{marginTop:12}}>
          <Link to="/">Go Home</Link>
        </div>
      </div>
    </div>
  );
}
