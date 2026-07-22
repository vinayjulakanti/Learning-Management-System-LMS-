import React, { useEffect, useMemo, useState } from 'react';
import { AttendanceAPI, CoursesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Attendance(){
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const isTeacher = role === 'teacher';

  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [roster, setRoster] = useState([]); // students for selected course
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statuses, setStatuses] = useState({}); // studentId -> 'present' | 'absent'
  const [myStatus, setMyStatus] = useState(''); // for student view (by date)
  const [summary, setSummary] = useState([]); // student subject-wise summary

  const loadCourses = async () => {
    if (!isTeacher) return;
    try {
      const { data } = await CoursesAPI.list();
      const cs = data.courses || [];
      setCourses(cs);
      if (!selectedCourse && cs.length) setSelectedCourse(cs[0]._id);
    } catch (e) { setError(e?.response?.data?.message || 'Failed to load courses'); }
  };

  const loadRosterAndAttendance = async () => {
    if (!isTeacher || !selectedCourse || !date) return;
    setLoading(true); 
    setError('');
    
    try {
      console.log('Loading roster and attendance for course:', selectedCourse, 'date:', date);
      
      // Always load roster
      const { data: r } = await CoursesAPI.roster(selectedCourse);
      const students = (r.students || []).filter(Boolean);
      console.log('Loaded roster:', students.length, 'students');
      setRoster(students);
      
      // Try to load existing attendance, but ignore errors (backend may not implement it yet)
      try {
        console.log('Loading existing attendance for course:', selectedCourse, 'date:', date);
        const { data: a } = await AttendanceAPI.listByDate(date, selectedCourse);
        console.log('Attendance data response:', a);
        
        const map = {};
        const attendanceRecords = a.records || a.attendance || [];
        console.log('Processing attendance records:', attendanceRecords.length);
        
        attendanceRecords.forEach(rec => { 
          if (rec.student?._id) {
            map[rec.student._id] = rec.status;
            console.log('Set attendance for student:', rec.student._id, 'status:', rec.status);
          }
        });
        
        setStatuses(map);
        console.log('Final attendance map:', map);
      } catch (attendanceError) {
        console.error('Error loading attendance:', attendanceError);
        setStatuses({});
      }
    } catch (e) {
      console.error('Error loading roster:', e);
      setError(e?.response?.data?.message || 'Failed to load roster');
    } finally { 
      setLoading(false);
    }
  };

  const loadMy = async () => {
    if (isTeacher) return;
    try {
      console.log('Loading student attendance for date:', date);
      
      // Load attendance for the selected date
      const { data } = await AttendanceAPI.myForDate(date);
      console.log('Student attendance response for date:', data);
      
      // Set status for the selected date
      setMyStatus(String(data?.status || '').toLowerCase());
      
      // Load all attendance records for comprehensive view
      try {
        const { data: allData } = await AttendanceAPI.myAll();
        console.log('All student attendance records:', allData);
        const allRecords = Array.isArray(allData?.records) ? allData.records : [];
        setSummary(allRecords);
        
        // Also check if there's attendance for the selected date in all records
        const todayRecords = allRecords.filter(record => record.date === date);
        if (todayRecords.length > 0) {
          console.log('Found attendance records for selected date:', todayRecords);
          setMyStatus(String(todayRecords[0].status || '').toLowerCase());
        }
      } catch (error) {
        console.error('Error loading all attendance records:', error);
        setSummary([]);
      }
    } catch (error) {
      console.error('Error loading student attendance:', error);
      setMyStatus('');
      setSummary([]);
    }
  };

  const loadSummary = async () => {
    if (isTeacher) return;
    try {
      const { data } = await AttendanceAPI.mySummary();
      setSummary(Array.isArray(data?.summary) ? data.summary : []);
    } catch (_) { setSummary([]); }
  };

  useEffect(()=>{ loadCourses(); /* eslint-disable-next-line */ }, [isTeacher]);
  useEffect(()=>{ loadRosterAndAttendance(); /* eslint-disable-next-line */ }, [selectedCourse, date]);
  useEffect(()=>{ loadMy(); /* eslint-disable-next-line */ }, [date, role]);
  useEffect(()=>{ loadSummary(); /* eslint-disable-next-line */ }, [role]);

  const setFor = async (studentId, status) => {
    const prev = statuses[studentId];
    setStatuses(old => ({ ...old, [studentId]: status }));
    
    try {
      console.log('Setting attendance:', { date, courseId: selectedCourse, studentId, status });
      console.log('API call parameters:', date, selectedCourse, studentId, status);
      
      // Validate required fields before API call
      if (!date || !selectedCourse || !studentId || !status) {
        console.error('Missing required fields for attendance update');
        alert('Missing required fields: date, course, student, and status are required');
        setStatuses(old => ({ ...old, [studentId]: prev }));
        return;
      }
      
      // Validate course and student IDs
      if (!selectedCourse || selectedCourse === 'undefined' || selectedCourse === 'null') {
        console.error('Invalid course ID:', selectedCourse);
        alert('Invalid course selected. Please select a valid course.');
        setStatuses(old => ({ ...old, [studentId]: prev }));
        return;
      }
      
      if (!studentId || studentId === 'undefined' || studentId === 'null') {
        console.error('Invalid student ID:', studentId);
        alert('Invalid student selected.');
        setStatuses(old => ({ ...old, [studentId]: prev }));
        return;
      }
      
      console.log('Making API call to update attendance...');
      const response = await AttendanceAPI.setStatus(date, selectedCourse, studentId, status);
      console.log('Attendance update response:', response);
      
      // Show success feedback
      const successMsg = `Attendance marked as ${status.toUpperCase()} for student`;
      alert(successMsg);
      
      // Refresh the roster to show updated attendance
      setTimeout(() => {
        loadRosterAndAttendance();
      }, 500);
      
    } catch (e) {
      console.error('Attendance update error:', e);
      console.error('Error details:', {
        message: e?.message,
        response: e?.response,
        status: e?.response?.status,
        data: e?.response?.data,
        config: e?.config
      });
      
      // Revert on failure and inform politely
      setStatuses(old => ({ ...old, [studentId]: prev }));
      
      let errorMsg = 'Failed to update attendance';
      if (e?.response?.data?.message) {
        errorMsg = e.response.data.message;
      } else if (e?.response?.status === 400) {
        errorMsg = 'Invalid attendance data. Please check all fields.';
      } else if (e?.response?.status === 403) {
        errorMsg = 'You do not have permission to update attendance.';
      } else if (e?.response?.status === 404) {
        errorMsg = 'Student or course not found. Please refresh the page.';
      } else if (e?.response?.status === 500) {
        errorMsg = 'Server error. Please try again later.';
      } else if (e?.code === 'NETWORK_ERROR') {
        errorMsg = 'Network error. Please check your connection.';
      } else if (e?.message) {
        errorMsg = e.message;
      }
      
      alert(errorMsg);
    }
  };

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      <div className="card" style={{maxWidth:980, margin:'24px auto', padding:16}}>
        <div className="row" style={{alignItems:'center', gap:12}}>
          <h2 style={{margin:'0 8px 0 0'}}>Attendance</h2>
          <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
          {isTeacher && (
            <>
              <label className="muted" style={{marginLeft:8}}>Course</label>
              <select value={selectedCourse} onChange={(e)=>setSelectedCourse(e.target.value)}>
                {courses.map(c => (<option key={c._id} value={c._id}>{c.title}</option>))}
              </select>
            </>
          )}
        </div>

        {error && <div className="alert danger" style={{marginTop:12}}>{error}</div>}

        {isTeacher ? (
          <div style={{marginTop:12}}>
            {loading ? (
              <div className="card">Loading roster…</div>
            ) : roster.length === 0 ? (
              <div className="muted">No students enrolled in this course.</div>
            ) : (
              <div className="list">
                {roster.map(s => (
                  <div key={s._id} className="row" style={{alignItems:'center', gap:8}}>
                    <div style={{minWidth:220}}>
                      <div style={{fontWeight:600}}>{s.name}</div>
                      <div className="muted small">Roll no: {s.rollNo || 'N/A'}</div>
                    </div>
                    <div className="tag" style={{marginLeft:'auto'}}>{(statuses[s._id]||'').toUpperCase() || '—'}</div>
                    <div style={{display:'flex', gap:6}}>
                      <button className="btn" onClick={()=>setFor(s._id, 'present')}>Present ✅</button>
                      <button className="btn" onClick={()=>setFor(s._id, 'absent')}>Absent ❌</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{marginTop:12}}>
            <div className="card" style={{maxWidth:640, marginBottom:12}}>
              <div className="row" style={{alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:600}}>{user?.name}</div>
                  {user?.rollNo && <div className="muted small">Roll no: {user.rollNo}</div>}
                </div>
                <div className="tag" style={{marginLeft:'auto'}}>{myStatus ? myStatus.toUpperCase() : '—'}</div>
              </div>
              <div className="muted small">Date: {new Date(date).toLocaleDateString()}</div>
            </div>

            {/* Attendance Bar Graph */}
            <div className="card" style={{maxWidth:980, marginBottom:12}}>
              <h3 style={{margin:'6px 0 12px'}}>📊 Course-wise Attendance Overview</h3>
              {summary.length === 0 ? (
                <div className="muted">No attendance records yet.</div>
              ) : (
                <div style={{display:'grid', gap:16}}>
                  {summary.map(item => (
                    <div key={String(item.courseId || item.courseTitle)} style={{
                      border:'1px solid var(--border)',
                      borderRadius:12,
                      padding:16,
                      background:'var(--panel)'
                    }}>
                      <div className="row" style={{justifyContent:'space-between', marginBottom:8}}>
                        <div style={{fontWeight:600, fontSize:16}}>{item.courseTitle || 'Course'}</div>
                        <div className="muted small" style={{fontSize:14}}>
                          {item.percentage}% ({item.presents}/{item.total} days)
                        </div>
                      </div>
                      
                      {/* Bar Graph */}
                      <div style={{marginBottom:8}}>
                        <div style={{height:30, background:'#f3f4f6', borderRadius:15, overflow:'hidden', position:'relative'}}>
                          <div style={{
                            width:`${Math.max(0, Math.min(100, item.percentage))}%`,
                            height:'100%',
                            background:item.percentage >= 75 ? '#10b981' : item.percentage >= 50 ? '#f59e0b' : '#ef4444',
                            borderRadius:15,
                            transition:'width 0.3s ease',
                            position:'relative'
                          }}>
                            <div style={{
                              position:'absolute',
                              right:8,
                              top:'50%',
                              transform:'translateY(-50%)',
                              color:'white',
                              fontSize:12,
                              fontWeight:600
                            }}>
                              {item.percentage}%
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Attendance Details */}
                      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, fontSize:12}}>
                        <div style={{textAlign:'center', padding:8, background:'#f0fdf4', borderRadius:8}}>
                          <div style={{color:'#166534', fontWeight:600, fontSize:14}}>{item.presents}</div>
                          <div style={{color:'#166534'}}>Present</div>
                        </div>
                        <div style={{textAlign:'center', padding:8, background:'#fef2f2', borderRadius:8}}>
                          <div style={{color:'#dc2626', fontWeight:600, fontSize:14}}>{item.total - item.presents}</div>
                          <div style={{color:'#dc2626'}}>Absent</div>
                        </div>
                        <div style={{textAlign:'center', padding:8, background:'#f3f4f6', borderRadius:8}}>
                          <div style={{color:'#374151', fontWeight:600, fontSize:14}}>{item.total}</div>
                          <div style={{color:'#374151'}}>Total</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attendance Logs */}
            <div className="card" style={{maxWidth:980}}>
              <h3 style={{margin:'6px 0 12px'}}>📋 Attendance Logs</h3>
              <div style={{display:'grid', gap:8}}>
                {/* Present Logs */}
                <div style={{
                  border:'1px solid #10b981',
                  borderRadius:8,
                  padding:12,
                  background:'#f0fdf4'
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
                    <div style={{fontSize:20}}>✅</div>
                    <div style={{fontWeight:600, color:'#166534'}}>Present Days</div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:4}}>
                    {summary.map(item => (
                      <div key={`present-${item.courseId}`} style={{
                        padding:4,
                        background:'white',
                        borderRadius:4,
                        fontSize:11,
                        textAlign:'center',
                        border:'1px solid #dcfce7'
                      }}>
                        <div style={{fontWeight:600, color:'#166534'}}>{item.courseTitle}</div>
                        <div style={{color:'#166534'}}>{item.presents} days</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Absent Logs */}
                <div style={{
                  border:'1px solid #ef4444',
                  borderRadius:8,
                  padding:12,
                  background:'#fef2f2'
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
                    <div style={{fontSize:20}}>❌</div>
                    <div style={{fontWeight:600, color:'#dc2626'}}>Absent Days</div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:4}}>
                    {summary.map(item => (
                      <div key={`absent-${item.courseId}`} style={{
                        padding:4,
                        background:'white',
                        borderRadius:4,
                        fontSize:11,
                        textAlign:'center',
                        border:'1px solid #fecaca'
                      }}>
                        <div style={{fontWeight:600, color:'#dc2626'}}>{item.courseTitle}</div>
                        <div style={{color:'#dc2626'}}>{item.total - item.presents} days</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
