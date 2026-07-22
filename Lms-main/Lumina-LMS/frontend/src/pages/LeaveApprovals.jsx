import React, { useEffect, useState } from 'react';
import { LeavesAPI } from '../api/client';

export default function LeaveApprovals() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true); 
    setError('');
    try {
      console.log('Loading pending leaves...');
      const { data } = await LeavesAPI.pending();
      console.log('Pending leaves response:', data);
      
      const leavesList = Array.isArray(data?.leaves) ? data.leaves : [];
      console.log('Processed leaves list:', leavesList);
      
      setItems(leavesList);
    } catch (e) {
      console.error('Error loading pending leaves:', e);
      setError(e?.response?.data?.message || 'Failed to load');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, type) => {
    try {
      if (type === 'approve') await LeavesAPI.approve(id);
      else await LeavesAPI.reject(id);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="card" style={{maxWidth:840, margin:'16px auto', padding:24, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24}}>
          <h2 style={{margin:0, color:'var(--text)', fontSize:28, fontWeight:700}}>Leave Approvals</h2>
          <div style={{background:'var(--primary)', color:'white', padding:'6px 12px', borderRadius:20, fontSize:14, fontWeight:600}}>
            {items.length} Pending
          </div>
        </div>
        
        {error && <div className="alert danger" style={{marginBottom:16, borderRadius:8}}>{error}</div>}
        
        {loading ? (
          <div style={{textAlign:'center', padding:40}}>
            <div style={{width:40, height:40, border:'4px solid var(--border)', borderTop:'4px solid var(--primary)', borderRadius:'50%', margin:'0 auto 16px', animation:'spin 1s linear infinite'}}></div>
            <div className="muted">Loading leave requests...</div>
          </div>
        ) : items.length === 0 ? (
          <div style={{textAlign:'center', padding:40, background:'var(--color-bg)', borderRadius:12}}>
            <div style={{fontSize:48, marginBottom:16}}>📋</div>
            <div className="muted" style={{fontSize:16}}>No pending leave requests</div>
            <div className="muted" style={{fontSize:14, marginTop:8}}>All caught up!</div>
          </div>
        ) : (
          <div style={{display:'grid', gap:12}}>
            {items.map(l => (
              <div key={l._id} style={{
                background:'var(--panel)', 
                border:'1px solid var(--border)', 
                borderRadius:12, 
                padding:16,
                display:'flex', 
                alignItems:'center', 
                gap:16,
                transition:'all 0.2s ease',
                cursor:'pointer'
              }} className="leave-card">
                <div style={{
                  width:48, 
                  height:48, 
                  borderRadius:'50%', 
                  background:'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display:'flex', 
                  alignItems:'center', 
                  justifyContent:'center',
                  color:'white',
                  fontWeight:700,
                  fontSize:18
                }}>
                  {(l.student?.name || 'Student').charAt(0).toUpperCase()}
                </div>
                
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontWeight:600, fontSize:16, marginBottom:4, color:'var(--text)'}}>
                    {l.student?.name || 'Student'}
                  </div>
                  <div className="muted" style={{fontSize:14, marginBottom:2}}>
                    {l.student?.rollNo ? `Roll No: ${l.student.rollNo}` : ''}
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginTop:4}}>
                    <span style={{background:'var(--color-bg)', padding:'4px 8px', borderRadius:6, fontSize:12, color:'var(--muted)'}}>
                      📅 {l.fromDate} → {l.toDate}
                    </span>
                    {l.reason && (
                      <span style={{color:'var(--muted)', fontSize:12, fontStyle:'italic'}}>
                        "{l.reason}"
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{display:'flex', gap:8}}>
                  <button 
                    onClick={()=>act(l._id,'approve')}
                    style={{
                      background:'var(--success)', 
                      color:'white', 
                      border:'none', 
                      padding:'8px 16px', 
                      borderRadius:8,
                      fontWeight:600,
                      cursor:'pointer',
                      transition:'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    onClick={()=>act(l._id,'reject')}
                    style={{
                      background:'var(--danger)', 
                      color:'white', 
                      border:'none', 
                      padding:'8px 16px', 
                      borderRadius:8,
                      fontWeight:600,
                      cursor:'pointer',
                      transition:'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    × Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .leave-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
      `}</style>
    </div>
  );
}
