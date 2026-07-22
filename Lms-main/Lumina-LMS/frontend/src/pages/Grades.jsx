import React, { useEffect, useMemo, useState } from 'react';
import { AssignmentsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Grades() {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all|lt5|gte5

  useEffect(() => {
    const load = async () => {
      try {
        if (role === 'teacher') {
          // Load all submissions across teacher's courses and keep only graded ones
          const { data } = await AssignmentsAPI.teachingSubmissions();
          const graded = (data.submissions || []).filter(s => s.grade !== null && s.grade !== undefined);
          // Normalize shape to reuse rendering: { _id, grade, course, assignment, student, attachments, content }
          setItems(graded.map(s => ({
            _id: s._id,
            grade: s.grade,
            course: s.course,
            assignment: s.assignment,
            student: s.student,
            attachments: s.attachments || [],
            content: s.content
          })));
        } else {
          const { data } = await AssignmentsAPI.myGrades();
          setItems(data.grades || []);
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'lt5') return items.filter(g => typeof g.grade === 'number' && g.grade < 5);
    if (filter === 'gte5') return items.filter(g => typeof g.grade === 'number' && g.grade >= 5);
    return items;
  }, [items, filter]);

  const handleDownload = (file) => {
    if (!file.data) return;
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name || 'submitted_file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container" style={{ padding: '24px', paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '0.05em' }}>
          {role === 'teacher' ? 'GRADES AWARDED' : 'MY GRADES'}
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text)' }}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9rem',
              color: '#374151',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          >
            <option value="all">All Grades</option>
            <option value="lt5">Grade Below 5</option>
            <option value="gte5">Grade 5 & Above</option>
          </select>
        </div>
      </div>

      {error && <div className="alert danger" style={{ marginBottom: '16px' }}>{error}</div>}
      
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading grades...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((g) => (
            <div 
              key={g._id} 
              className="card hover-lift"
              style={{
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--panel)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text)' }}>
                    {g.assignment?.title || 'Assignment'}
                  </h3>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--muted)',
                    backgroundColor: 'var(--bg)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border)'
                  }}>
                    {g.course?.title || 'Course'}
                  </span>
                </div>
                
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16,185,129,0.08)',
                  color: '#10B981',
                  border: '1px solid rgba(16,185,129,0.15)',
                  display: 'inline-block'
                }}>
                  Grade: {g.grade}
                </span>
              </div>

              {role === 'teacher' && g.student && (
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: '500' }}>
                  👤 Student: <strong style={{ color: 'var(--text)' }}>{g.student.name}</strong> ({g.student.email})
                </div>
              )}

              {g.content && (
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--muted)',
                  background: 'var(--bg)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  marginTop: '4px'
                }}>
                  <strong style={{ color: 'var(--text)' }}>Student Submission Text:</strong> {g.content}
                </div>
              )}

              {g.attachments && g.attachments.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  borderTop: '1px solid var(--border)', 
                  paddingTop: '12px', 
                  marginTop: '4px'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text)', textTransform: 'uppercase' }}>
                    Graded Submission File(s):
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {g.attachments.map((file, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleDownload(file)}
                        className="btn secondary ripple-btn"
                        style={{ 
                          padding: '6px 14px', 
                          fontSize: '0.8rem', 
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        📥 Download {file.name || `Attachment ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#6B7280', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
              <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#374151' }}>no grades are allocated</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
