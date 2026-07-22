import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './settings.css';
import { AuthAPI } from '../api/client';

export default function Settings(){
  const { user } = useAuth();
  const [cur, setCur] = useState('');
  const [npw, setNpw] = useState('');
  const [cpw, setCpw] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="container" style={{padding:24}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="settings-panel card" style={{maxWidth:720, margin:'0 auto'}}>
        <h2 style={{marginTop:0}}>Settings</h2>
        {!user && <div>Please log in.</div>}
        {user && (
          <form className="form" onSubmit={(e)=>e.preventDefault()}>

            <h3 style={{marginTop:24}}>Change password</h3>
            {msg && <div className="alert" style={{marginBottom:12}}>{msg}</div>}
            {err && <div className="alert danger" style={{marginBottom:12}}>{err}</div>}
            <label>Current password</label>
            <div className="password-field">
              <input className="input rounded" type={show1?'text':'password'} value={cur} onChange={e=>setCur(e.target.value)} placeholder="Current password" />
              <button type="button" className="eye" onClick={()=>setShow1(s=>!s)} aria-label={show1? 'Hide password':'Show password'}>{show1?'🙈':'👁️'}</button>
            </div>
            <label>New password</label>
            <div className="password-field">
              <input className="input rounded" type={show2?'text':'password'} value={npw} onChange={e=>setNpw(e.target.value)} placeholder="New password" />
              <button type="button" className="eye" onClick={()=>setShow2(s=>!s)} aria-label={show2? 'Hide password':'Show password'}>{show2?'🙈':'👁️'}</button>
            </div>
            <label>Confirm new password</label>
            <div className="password-field">
              <input className="input rounded" type={show3?'text':'password'} value={cpw} onChange={e=>setCpw(e.target.value)} placeholder="Confirm new password" />
              <button type="button" className="eye" onClick={()=>setShow3(s=>!s)} aria-label={show3? 'Hide password':'Show password'}>{show3?'🙈':'👁️'}</button>
            </div>
            <button className="pill primary" disabled={loading} onClick={async()=>{
              setMsg(''); setErr('');
              if (!cur || !npw || !cpw) { setErr('Please fill all fields'); return; }
              if ((npw||'').length < 8) { setErr('New password must be at least 8 characters long'); return; }
              if (npw !== cpw) { setErr('Passwords do not match'); return; }
              try{
                setLoading(true);
                await AuthAPI.changePassword({ currentPassword: cur, newPassword: npw });
                setMsg('Password changed successfully');
                setCur(''); setNpw(''); setCpw('');
              }catch(e){
                setErr(e?.response?.data?.message || 'Failed to change password');
              }finally{ setLoading(false); }
            }}>Update password</button>
          </form>
        )}
      </div>
    </div>
  );
}
