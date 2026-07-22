import React, { useEffect, useState } from 'react';
import { AssignmentsAPI } from '../api/client';

export default function Submissions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grades, setGrades] = useState({}); // submissionId -> number|string

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        const { data } = await AssignmentsAPI.teachingSubmissions();
        setSubs(data.submissions || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const gradeSub = async (s) => {
    const val = Number(grades[s._id]);
    if (Number.isNaN(val)) { alert('Please enter a number grade'); return; }
    try {
      await AssignmentsAPI.grade(s.course?._id, s.assignment?._id, s._id, { grade: val });
      // refresh list
      const { data } = await AssignmentsAPI.teachingSubmissions();
      setSubs(data.submissions || []);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to save grade');
    }
  };

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="row" style={{marginTop:16, marginBottom:12}}>
        <h2 style={{margin:0}}>Submissions</h2>
      </div>
      {error && <div className="alert danger">{error}</div>}
      {loading ? (
        <div className="card">Loading...</div>
      ) : (
        <div className="list">
          {subs.map(s => (
            <div key={s._id} className="card" style={{display:'flex', gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>{s.assignment?.title || 'Assignment'}</div>
                <div className="muted">Course: {s.course?.title || 'N/A'}</div>
                <div className="muted" style={{maxWidth:520}}>By: {s.student?.name || 'Unknown'} · {s.student?.email}</div>
                <div className="muted" style={{maxWidth:720, marginTop:6}}>{s.content}</div>
              </div>
              <div style={{alignSelf:'flex-start', minWidth:220}}>
                {typeof s.grade === 'number' && (
                  <div className="tag" style={{marginBottom:8}}>Grade: {s.grade}</div>
                )}
                <div className="row" style={{gap:8}}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={grades[s._id] ?? (typeof s.grade==='number'? s.grade : '')}
                    onChange={(e)=>setGrades({...grades, [s._id]: e.target.value})}
                    placeholder="Enter grade"
                    style={{width:100}}
                  />
                  <button className="btn primary" onClick={()=>gradeSub(s)}>Grade</button>
                </div>
              </div>
            </div>
          ))}
          {subs.length === 0 && <div className="card">No submissions yet.</div>}
        </div>
      )}
    </div>
  );
}
