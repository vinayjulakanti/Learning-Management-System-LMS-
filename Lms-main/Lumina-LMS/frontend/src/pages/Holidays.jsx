import React, { useEffect, useState } from 'react';
import { ContentAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Holidays(){
  const { user } = useAuth();
  const isTeacher = (String(user?.role || '').toLowerCase() === 'teacher');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await ContentAPI.get('holidays');
      setTitle(data?.content?.title || '');
      setBody(data?.content?.body || '');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="card" style={{maxWidth:900, margin:'24px auto'}}>
        <div className="row" style={{alignItems:'center'}}>
          <h2 style={{marginTop:0, marginBottom:0}}>Holidays</h2>
          {isTeacher && !loading && (
            <div style={{display:'flex', gap:8}}>
              <button className="btn" onClick={()=>setEditing(e=>!e)} title={editing? 'Close editor' : (title||body? 'Edit' : 'Create')}>
                {editing ? 'Close' : (title||body ? '✏️ Edit' : '➕ Create')}
              </button>
              {editing && (
                <button className="btn primary" onClick={async()=>{
                  try { await ContentAPI.upsert('holidays', { title, body }); setEditing(false); }
                  catch(e){ alert(e?.response?.data?.message || 'Failed to save'); }
                }}>Save</button>
              )}
            </div>
          )}
        </div>
        {!isTeacher && error && <div className="alert danger" style={{marginTop:8}}>{error}</div>}
        {loading ? (
          <div className="muted">Loading…</div>
        ) : (
          <div style={{marginTop:8}}>
            {editing && isTeacher ? (
              <div className="form">
                <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" />
                <textarea rows={6} value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Details" />
              </div>
            ) : (
              <>
                {title && <h3 style={{margin:'8px 0 4px 0'}}>{title}</h3>}
                {body ? (
                  <div style={{whiteSpace:'pre-wrap'}}>{body}</div>
                ) : (
                  <div className="muted">No holidays published yet.</div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
