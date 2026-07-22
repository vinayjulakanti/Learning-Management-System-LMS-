import React, { useEffect, useState } from 'react';
import { LeavesAPI } from '../api/client';

export default function Leave() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leaves, setLeaves] = useState([]);

  const load = async () => {
    try {
      const { data } = await LeavesAPI.myLeaves();
      setLeaves(Array.isArray(data?.leaves) ? data.leaves : []);
    } catch (e) {
      setLeaves([]);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fromDate || !toDate) { setError('Please select from and to dates'); return; }
    setLoading(true);
    try {
      await LeavesAPI.apply({ fromDate, toDate, reason });
      setFromDate(''); setToDate(''); setReason('');
      await load();
      alert('Leave request submitted');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  const badge = (status) => {
    const s = String(status || '').toLowerCase();
    const color = s === 'approved' ? '#16a34a' : s === 'rejected' ? '#dc2626' : '#475569';
    return <span className="tag" style={{background:'transparent', border:`1px solid ${color}`, color, padding:'2px 8px', borderRadius:9999}}>{s || 'pending'}</span>;
  };

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="card" style={{maxWidth:720, margin:'16px auto', padding:16}}>
        <h2 style={{margin:'0 0 12px'}}>Apply for Leave</h2>
        {error && <div className="alert danger" style={{marginBottom:8}}>{error}</div>}
        <form onSubmit={submit} className="row" style={{gap:8, alignItems:'center', flexWrap:'wrap'}}>
          <label>From</label>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
          <label>To</label>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} />
          <input type="text" placeholder="Reason (optional)" value={reason} onChange={e=>setReason(e.target.value)} style={{flex:1, minWidth:240}} />
          <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit'}</button>
        </form>
      </div>

      <div className="card" style={{maxWidth:720, margin:'0 auto', padding:16}}>
        <h3 style={{margin:'0 0 12px'}}>My Requests</h3>
        {leaves.length === 0 ? (
          <div className="muted">No leave requests yet.</div>
        ) : (
          <div className="list" style={{display:'grid', gap:8}}>
            {leaves.map(l => (
              <div key={l._id} className="row" style={{alignItems:'center', gap:8}}>
                <div style={{minWidth:200}}>
                  <div style={{fontWeight:600}}>{l.fromDate} → {l.toDate}</div>
                  {l.reason && <div className="muted small">{l.reason}</div>}
                </div>
                <div style={{marginLeft:'auto'}}>{badge(l.status)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
