import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ContentAPI } from '../api/client';

export default function Project(){
  const { user } = useAuth();
  const isTeacher = (String(user?.role || '').toLowerCase() === 'teacher');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async ()=>{
    setLoading(true); setError('');
    try{
      const { data } = await ContentAPI.get('project');
      setTitle(data?.content?.title || '');
      setBody(data?.content?.body || '');
    }catch(e){ setError(e?.response?.data?.message || 'Failed to load'); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  const save = async (e)=>{
    e.preventDefault(); setSaving(true); setError('');
    try{ await ContentAPI.upsert('project', { title, body }); setEditing(false);} 
    catch(e2){ setError(e2?.response?.data?.message || 'Failed to save'); }
    finally{ setSaving(false); }
  };

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="card" style={{maxWidth:900, margin:'24px auto'}}>
        <div className="row" style={{alignItems:'center'}}>
          <h2 style={{marginTop:0}}>Project</h2>
          {isTeacher && (
            <button className="btn" onClick={()=>setEditing(e=>!e)}>{editing ? 'Cancel' : (title || body ? 'Edit' : 'Create Project')}</button>
          )}
        </div>
        {error && <div className="alert danger" style={{marginTop:8}}>{error}</div>}
        {loading ? (
          <div className="muted">Loading…</div>
        ) : !editing ? (
          <div style={{marginTop:8}}>
            {title && <h3 style={{margin:'8px 0 4px 0'}}>{title}</h3>}
            {body ? (
              <div style={{whiteSpace:'pre-wrap'}}>{body}</div>
            ) : (
              <div className="muted">No projects yet.</div>
            )}
          </div>
        ) : (
          <form className="form" onSubmit={save} style={{marginTop:8}}>
            <label>Title</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g., Final Year Project List" />
            <label>Content</label>
            <textarea rows={10} value={body} onChange={(e)=>setBody(e.target.value)} placeholder={"Provide project guidelines, topics, or groups."} />
            <button className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
