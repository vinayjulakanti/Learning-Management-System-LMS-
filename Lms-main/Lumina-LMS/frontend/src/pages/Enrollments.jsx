import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CoursesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Enrollments() {
  const { user } = useAuth();
  const role = (String(user?.role || '')).toLowerCase();
  const [items, setItems] = useState([]); // student: courses; teacher: students of selected course
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]); // teacher course options
  const [selected, setSelected] = useState(''); // selected course id for teacher

  useEffect(() => {
    const load = async () => {
      try {
        if (role === 'teacher') {
          const { data: all } = await CoursesAPI.list();
          const cs = all.courses || [];
          setCourses(cs);
          if (!selected && cs.length > 0) setSelected(cs[0]._id);
        } else {
          const { data } = await CoursesAPI.myEnrollments();
          setItems(data.courses || (data.enrollments || []).map(e=>e.course).filter(Boolean));
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    const loadRoster = async () => {
      if (role !== 'teacher' || !selected) return;
      setLoading(true); setError('');
      try {
        const { data } = await CoursesAPI.roster(selected);
        const course = (courses || []).find(c => c._id === selected);
        const list = (data.students || []).map(s => ({ course, student: s }));
        setItems(list);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load roster');
        setItems([]);
      } finally { setLoading(false); }
    };
    loadRoster();
  }, [selected]);

  return (
    <div className="container">
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="row" style={{marginTop:16, alignItems:'center'}}>
        <h2 style={{margin:0}}>{role==='teacher' ? 'Enrolled Students' : 'My Enrollments'}</h2>
        {role==='teacher' && courses.length > 0 && (
          <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:8}}>
            <label style={{fontWeight:600}}>Filter by course</label>
            <select value={selected} onChange={(e)=>setSelected(e.target.value)}>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {error && <div className="alert danger">{error}</div>}
      {loading ? (
        <div className="card">Loading...</div>
      ) : (
        (role==='teacher' ? (
          <div className="list" style={{marginTop:12}}>
            {items.map((it, idx) => (
              <div key={`${it.course?._id}_${it.student?._id}_${idx}`} className="card">
                <div className="row">
                  <div style={{fontWeight:600}}>{it.student?.name}</div>
                  <span className="tag">{it.course?.title}</span>
                </div>
                <div className="muted">{it.student?.email}</div>
              </div>
            ))}
            {items.length === 0 && <div className="card">No enrolled students yet.</div>}
          </div>
        ) : (
          <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))'}}>
            {items.map(c => (
              <div key={c._id} className="card">
                <div className="row">
                  <h3 style={{margin:0}}>{c.title}</h3>
                  <span className="tag">{c.duration || 'N/A'}</span>
                </div>
                <p className="muted" style={{minHeight:42}}>{c.description}</p>
                <Link to={`/courses/${c._id}`} className="btn">Open</Link>
              </div>
            ))}
            {items.length === 0 && (
              <div className="card">No enrollments yet.</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
