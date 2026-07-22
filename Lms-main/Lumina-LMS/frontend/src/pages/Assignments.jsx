import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CoursesAPI, AssignmentsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Assignments(){
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const [items, setItems] = useState([]); // {course, assignment}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]); // for teacher
  const [newAssign, setNewAssign] = useState({ courseId: '', title: '', description: '', dueDate: '' });
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState('all'); // student filter: all|yet to start|completed|not completed
  const [mySubs, setMySubs] = useState({}); // assignmentId -> submission

  const getAssignmentStatus = (assignment) => {
    if (mySubs[assignment._id]) {
      return 'completed';
    }
    if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
      return 'not completed';
    }
    return 'yet to start';
  };

  const getStatusBadge = (assignment) => {
    const currentStatus = getAssignmentStatus(assignment);
    let bgColor = 'rgba(37,99,235,0.06)';
    let color = '#2563EB';
    let label = 'Yet to Start';
    if (currentStatus === 'completed') {
      bgColor = 'rgba(16,185,129,0.06)';
      color = '#10B981';
      label = 'Completed';
    } else if (currentStatus === 'not completed') {
      bgColor = 'rgba(239,68,68,0.06)';
      color = '#EF4444';
      label = 'Not Completed';
    }
    return (
      <span style={{
        fontSize: '0.75rem',
        fontWeight: '700',
        padding: '4px 10px',
        borderRadius: '6px',
        backgroundColor: bgColor,
        color: color,
        border: `1px solid ${color}20`,
        display: 'inline-block'
      }}>
        {label}
      </span>
    );
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        if (role === 'student') {
          const { data } = await CoursesAPI.myEnrollments();
          const enrolls = (data.enrollments || []).filter(e=>e?.course);
          const lists = await Promise.all(
            enrolls.map(e => AssignmentsAPI.listByCourse(e.course._id).then(r => ({ course: e.course, assignments: r.data.assignments || [] })))
          );
          const flat = [];
          lists.forEach(({ course, assignments }) => {
            assignments.forEach(a => flat.push({ course, assignment: a }));
          });
          setItems(flat);
          try {
            const { data: ms } = await AssignmentsAPI.mySubmissions();
            const map = {};
            (ms.submissions || []).forEach(s => { if (s.assignment?._id) map[s.assignment._id] = s; });
            setMySubs(map);
          } catch(_) { setMySubs({}); }
        } else if (role === 'teacher') {
          const { data: all } = await CoursesAPI.list();
          const cs = all.courses || [];
          setCourses(cs);
          const lists = await Promise.all(
            cs.map(c => AssignmentsAPI.listByCourse(c._id).then(r => ({ course: c, assignments: r.data.assignments || [] })))
          );
          const flat = [];
          lists.forEach(({ course, assignments }) => {
            assignments.forEach(a => flat.push({ course, assignment: a }));
          });
          setItems(flat);
        } else {
          setItems([]);
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load assignments');
      } finally { setLoading(false); }
    };
    load();
  }, [user]);

  const filtered = useMemo(()=>{
    if (role !== 'student') return items;
    if (status === 'all') return items;
    return items.filter(({ assignment }) => getAssignmentStatus(assignment) === status);
  }, [items, status, role, mySubs]);

  const createAssignment = async (e) => {
    e.preventDefault();
    if (!newAssign.courseId || !newAssign.title) return;
    setCreating(true); setError('');
    try {
      await AssignmentsAPI.create(newAssign.courseId, { title: newAssign.title, description: newAssign.description, dueDate: newAssign.dueDate });
      setNewAssign({ courseId: '', title: '', description: '', dueDate: '' });
      // reload
      const { data: all } = await CoursesAPI.list();
      const cs = all.courses || [];
      setCourses(cs);
      const lists = await Promise.all(
        cs.map(c => AssignmentsAPI.listByCourse(c._id).then(r => ({ course: c, assignments: r.data.assignments || [] })))
      );
      const flat = [];
      lists.forEach(({ course, assignments }) => { assignments.forEach(a => flat.push({ course, assignment: a })); });
      setItems(flat);
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Failed to create assignment');
    } finally { setCreating(false); }
  };

  return (
    <div className="container" style={{ padding: '24px', paddingBottom: '60px' }}>

      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '0.05em' }}>
          {role === 'teacher' ? 'ASSIGNMENT CREATOR' : 'ASSIGNMENTS'}
        </h1>
        {role === 'student' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text)' }}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
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
              <option value="all">My Assignments</option>
              <option value="yet to start">Yet to Start</option>
              <option value="completed">Completed</option>
              <option value="not completed">Not Completed</option>
            </select>
          </div>
        )}
      </div>

      {role === 'teacher' && (
        <div className="card" style={{ marginBottom: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.15rem', fontWeight: '800' }}>Create Assignment</h3>
          <form className="form" onSubmit={createAssignment} style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'grid', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#4B5563' }}>Course</label>
              <select value={newAssign.courseId} onChange={(e) => setNewAssign({ ...newAssign, courseId: e.target.value })} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                <option value="">Select a course</option>
                {courses.map(c => (<option key={c._id} value={c._id}>{c.title}</option>))}
              </select>
            </div>
            <div style={{ display: 'grid', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#4B5563' }}>Objective</label>
              <input value={newAssign.title} onChange={(e) => setNewAssign({ ...newAssign, title: e.target.value })} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB' }} />
            </div>
            <div style={{ display: 'grid', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#4B5563' }}>Description</label>
              <textarea rows={3} value={newAssign.description} onChange={(e) => setNewAssign({ ...newAssign, description: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB' }} />
            </div>
            <div style={{ display: 'grid', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#4B5563' }}>Due Date</label>
              <input type="date" value={newAssign.dueDate} onChange={(e) => setNewAssign({ ...newAssign, dueDate: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB' }} />
            </div>
            <button className="btn primary ripple-btn" disabled={creating} style={{ padding: '10px 20px', borderRadius: '6px', fontWeight: '700', marginTop: '8px' }}>
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
        </div>
      )}

      {error && <div className="alert danger" style={{ marginBottom: '16px' }}>{error}</div>}
      
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading assessments...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(({ course, assignment }) => (
            <div 
              key={`${course._id}_${assignment._id}`} 
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
                    {assignment.title}
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
                    {course.title}
                  </span>
                </div>
                {role === 'student' && getStatusBadge(assignment)}
              </div>

              {assignment.description && (
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                  {assignment.description}
                </p>
              )}

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderTop: '1px solid var(--border)', 
                paddingTop: '16px', 
                marginTop: '4px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {assignment.dueDate && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                      📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  {role === 'student' && mySubs[assignment._id] && (
                    <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: '600' }}>
                      ✓ Submitted on {new Date(mySubs[assignment._id].updatedAt || mySubs[assignment._id].createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <Link 
                  to={`/courses/${course._id}`} 
                  className="btn primary ripple-btn" 
                  style={{ 
                    padding: '6px 16px', 
                    fontSize: '0.85rem', 
                    borderRadius: '6px',
                    fontWeight: '700'
                  }}
                >
                  Open Course
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <div style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text)' }}>no assesssment are allocated</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
