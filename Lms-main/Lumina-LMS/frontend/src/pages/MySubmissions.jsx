import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AssignmentsAPI } from '../api/client';

export default function MySubmissions(){
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(()=>{
    const load = async()=>{
      setErr(''); setLoading(true);
      try{
        const { data } = await AssignmentsAPI.mySubmissions();
        setSubs(data.submissions || []);
      }catch(e){ setErr(e?.response?.data?.message || 'Failed to load submissions'); }
      finally{ setLoading(false); }
    };
    load();
  },[]);

  return (
    <div className="container">
      <h2 style={{marginTop:16}}>My Submissions</h2>
      {err && <div className="alert danger">{err}</div>}
      {loading ? (
        <div className="card">Loading...</div>
      ) : (
        <div className="list" style={{marginTop:12}}>
          {subs.map(s => (
            <div key={s._id} className="card">
              <div className="row">
                <div style={{fontWeight:600}}>{s.assignment?.title || 'Assignment'}</div>
                <span className="tag">{s.course?.title || 'Course'}</span>
              </div>
              <div className="muted small">Submitted: {new Date(s.createdAt || s.updatedAt).toLocaleString()}</div>
              {typeof s.grade === 'number' && (
                <div className="muted">Grade: <strong>{s.grade}</strong></div>
              )}
              <div style={{marginTop:8}}>
                <Link to={`/courses/${s.course?._id || ''}`} className="btn">Open course</Link>
              </div>
            </div>
          ))}
          {subs.length === 0 && <div className="card">No submissions yet.</div>}
        </div>
      )}
    </div>
  );
}
