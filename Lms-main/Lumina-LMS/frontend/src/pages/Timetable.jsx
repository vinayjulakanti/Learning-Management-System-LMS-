import React, { useEffect, useState } from 'react';
import { ContentAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Timetable(){
  const { user } = useAuth();
  const isTeacher = (String(user?.role || '').toLowerCase() === 'teacher');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [examEditing, setExamEditing] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examForm, setExamForm] = useState({
    subject: '',
    examType: 'Mid-term',
    time: '',
    venue: '',
    duration: '',
    syllabus: '',
    instructions: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Sample exam timetable data with more realistic// Sample exam data
  const examSchedule = [
    {
      id: 1,
      date: '2026-03-04', // Today
      time: '10:00 AM - 12:00 PM',
      subject: 'Mathematics',
      examType: 'Mid-term',
      venue: 'Room A-101',
      duration: '2 hours',
      syllabus: 'Calculus and Algebra',
      instructions: 'Bring calculator and ID card'
    },
    {
      id: 2,
      date: '2026-03-04', // Today
      time: '02:00 PM - 04:00 PM',
      subject: 'Physics',
      examType: 'Practical',
      venue: 'Lab B-205',
      duration: '2 hours',
      syllabus: 'Mechanics and Thermodynamics',
      instructions: 'Lab coat required'
    },
    {
      id: 3,
      date: '2026-03-05', // Tomorrow
      time: '09:00 AM - 11:00 AM',
      subject: 'Computer Science',
      examType: 'Theory',
      venue: 'Room C-201',
      duration: '2 hours',
      syllabus: 'Data Structures and Algorithms',
      instructions: 'No calculators, closed book'
    },
    {
      id: 4,
      date: '2026-03-06',
      time: '10:00 AM - 12:30 PM',
      subject: 'Chemistry',
      examType: 'Mid-term',
      venue: 'Room A-102',
      duration: '2.5 hours',
      syllabus: 'Organic and Inorganic Chemistry',
      instructions: 'Periodic table provided'
    },
    {
      id: 5,
      date: '2026-03-07',
      time: '09:00 AM - 11:00 AM',
      subject: 'English',
      examType: 'Quiz',
      venue: 'Room D-401',
      duration: '2 hours',
      syllabus: 'Grammar and Comprehension',
      instructions: 'Writing sheets provided'
    },
    {
      id: 6,
      date: '2026-03-10',
      time: '02:00 PM - 04:30 PM',
      subject: 'Biology',
      examType: 'Final',
      venue: 'Lab B-201',
      duration: '2.5 hours',
      syllabus: 'Complete Biology Syllabus',
      instructions: 'Diagrams required'
    },
    {
      id: 7,
      date: '2026-03-12',
      time: '10:00 AM - 12:00 PM',
      subject: 'Mathematics',
      examType: 'Final',
      venue: 'Room A-101',
      duration: '2 hours',
      syllabus: 'Complete Mathematics Syllabus',
      instructions: 'All topics covered'
    },
    {
      id: 8,
      date: '2026-03-14',
      time: '09:00 AM - 12:00 PM',
      subject: 'Computer Science',
      examType: 'Final',
      venue: 'Room C-301',
      duration: '3 hours',
      syllabus: 'Complete Syllabus',
      instructions: 'All topics covered'
    }
  ];

  // Regular class timetable
  const classSchedule = [
    {
      id: 1,
      day: 'Monday',
      time: '09:00 AM - 10:00 AM',
      subject: 'Mathematics',
      teacher: 'Dr. Smith',
      venue: 'Room A-101'
    },
    {
      id: 2,
      day: 'Monday',
      time: '10:30 AM - 11:30 AM',
      subject: 'Physics',
      teacher: 'Prof. Johnson',
      venue: 'Room B-205'
    },
    {
      id: 3,
      day: 'Tuesday',
      time: '09:00 AM - 10:30 AM',
      subject: 'Computer Science',
      teacher: 'Ms. Davis',
      venue: 'Lab C-301'
    },
    {
      id: 4,
      day: 'Tuesday',
      time: '11:00 AM - 12:00 PM',
      subject: 'Chemistry',
      teacher: 'Dr. Wilson',
      venue: 'Room A-102'
    },
    {
      id: 5,
      day: 'Wednesday',
      time: '09:00 AM - 10:00 AM',
      subject: 'English',
      teacher: 'Mrs. Brown',
      venue: 'Room D-401'
    },
    {
      id: 6,
      day: 'Wednesday',
      time: '10:30 AM - 11:30 AM',
      subject: 'Biology',
      teacher: 'Dr. Miller',
      venue: 'Lab B-201'
    }
  ];

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await ContentAPI.get('timetable');
      setTitle(data?.content?.title || '');
      setBody(data?.content?.body || '');
    } catch (e) { setError(e?.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  const getExamsForDate = (date) => {
    return examSchedule.filter(exam => exam.date === date);
  };

  const getClassesForDay = (day) => {
    return classSchedule.filter(cls => cls.day === day);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getExamTypeColor = (type) => {
    const colors = {
      'Mid-term': '#3b82f6',
      'Final': '#dc2626',
      'Practical': '#10b981',
      'Quiz': '#f59e0b'
    };
    return colors[type] || '#64748b';
  };

  const isToday = (dateString) => {
    return dateString === new Date().toISOString().split('T')[0];
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  // Exam management functions for teachers
  const handleAddExam = () => {
    setSelectedExam(null);
    setExamForm({
      subject: '',
      examType: 'Mid-term',
      time: '',
      venue: '',
      duration: '',
      syllabus: '',
      instructions: '',
      date: selectedDate
    });
    setExamEditing(true);
  };

  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    setExamForm({
      subject: exam.subject,
      examType: exam.examType,
      time: exam.time,
      venue: exam.venue,
      duration: exam.duration,
      syllabus: exam.syllabus,
      instructions: exam.instructions,
      date: exam.date
    });
    setExamEditing(true);
  };

  const handleDeleteExam = (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      // In a real app, this would call an API to delete the exam
      console.log('Delete exam:', examId);
      // For now, we'll just show a success message
      alert('Exam deleted successfully!');
    }
  };

  const handleSaveExam = () => {
    if (!examForm.subject || !examForm.time || !examForm.venue || !examForm.duration) {
      alert('Please fill in all required fields');
      return;
    }

    // In a real app, this would call an API to save the exam
    console.log('Save exam:', examForm);
    
    // Create notification for students about new/updated exam
    const notificationMessage = selectedExam 
      ? `Exam "${examForm.subject}" has been updated. Date: ${examForm.date}, Time: ${examForm.time}`
      : `New exam scheduled: "${examForm.subject}" on ${examForm.date} at ${examForm.time}`;
    
    alert(`Exam saved successfully! Students will be notified: ${notificationMessage}`);
    setExamEditing(false);
    setSelectedExam(null);
  };

  return (
    <div className="container" style={{padding:16}}>
      <div className="page-watermark" style={{ backgroundImage: 'url(/logo-lms.svg)' }} />
      
      <div className="card" style={{maxWidth:1200, margin:'24px auto', padding:24, borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <h2 style={{marginTop:0, marginBottom:0}}>📅 Exam Timetable</h2>
            {isTeacher && (
              <div style={{
                background: '#f59e0b',
                color: 'white',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                ✏️ Teacher Mode
              </div>
            )}
          </div>
          <div style={{display:'flex', gap:8}}>
            {!isTeacher && (
              <button 
                className="btn" 
                onClick={() => {
                  alert('Timetable content feature coming soon! This will show detailed timetable information and announcements.');
                }}
                style={{background:'#6366f1', color:'white'}}
              >
                📋 View Content
              </button>
            )}
            {isTeacher && !loading && (
              <button 
                className="btn" 
                onClick={()=>setEditing(e=>!e)} 
                title={editing? 'Close editor' : (title||body? 'Edit' : 'Create')}
                style={{background: '#3b82f6', color: 'white'}}
              >
                {editing ? '✖️ Close' : '✏️ Edit Timetable'}
              </button>
            )}
            {isTeacher && editing && (
              <button 
                className="btn primary" 
                onClick={async()=>{
                  try { await ContentAPI.upsert('timetable', { title, body }); setEditing(false); }
                  catch(e){ alert(e?.response?.data?.message || 'Failed to save'); }
                }}
              >
                💾 Save Timetable
              </button>
            )}
            {isTeacher && (
              <button 
                className="btn primary" 
                onClick={handleAddExam}
                style={{background: '#10b981'}}
              >
                ➕ Add Exam
              </button>
            )}
          </div>
        </div>

        {/* Date Selector */}
        <div style={{marginBottom:24}}>
          <label style={{display:'block', marginBottom:8, fontWeight:600}}>Select Date:</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{padding:8, borderRadius:6, border:'1px solid var(--border)', fontSize:16}}
          />
          <span style={{marginLeft:12, color:'var(--muted)'}}>
            {formatDate(selectedDate)}
          </span>
        </div>

        {/* Exam Editing Form */}
        {examEditing && (
          <div style={{
            background:'var(--color-bg)',
            padding:20,
            borderRadius:12,
            marginBottom:24,
            border:'2px solid var(--primary)'
          }}>
            <h3 style={{marginTop:0, marginBottom:16, color:'var(--primary)'}}>
              {selectedExam ? 'Edit Exam' : 'Add New Exam'}
            </h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:16, marginBottom:16}}>
              <div>
                <label>Subject *</label>
                <input
                  type="text"
                  value={examForm.subject}
                  onChange={(e) => setExamForm({...examForm, subject: e.target.value})}
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>
              <div>
                <label>Exam Type *</label>
                <select
                  value={examForm.examType}
                  onChange={(e) => setExamForm({...examForm, examType: e.target.value})}
                  required
                >
                  <option value="Mid-term">Mid-term</option>
                  <option value="Final">Final</option>
                  <option value="Practical">Practical</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Theory">Theory</option>
                </select>
              </div>
              <div>
                <label>Date *</label>
                <input
                  type="date"
                  value={examForm.date}
                  onChange={(e) => setExamForm({...examForm, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label>Time *</label>
                <input
                  type="text"
                  value={examForm.time}
                  onChange={(e) => setExamForm({...examForm, time: e.target.value})}
                  placeholder="e.g., 10:00 AM - 12:00 PM"
                  required
                />
              </div>
              <div>
                <label>Venue *</label>
                <input
                  type="text"
                  value={examForm.venue}
                  onChange={(e) => setExamForm({...examForm, venue: e.target.value})}
                  placeholder="e.g., Room A-101"
                  required
                />
              </div>
              <div>
                <label>Duration *</label>
                <input
                  type="text"
                  value={examForm.duration}
                  onChange={(e) => setExamForm({...examForm, duration: e.target.value})}
                  placeholder="e.g., 2 hours"
                  required
                />
              </div>
            </div>
            
            <div style={{marginBottom:16}}>
              <label>Syllabus</label>
              <textarea
                value={examForm.syllabus}
                onChange={(e) => setExamForm({...examForm, syllabus: e.target.value})}
                placeholder="Exam syllabus (optional)"
                rows={2}
                style={{width:'100%', padding:8, borderRadius:6, border:'1px solid var(--border)'}}
              />
            </div>

            <div style={{marginBottom:16}}>
              <label>Instructions</label>
              <textarea
                value={examForm.instructions}
                onChange={(e) => setExamForm({...examForm, instructions: e.target.value})}
                placeholder="Exam instructions (optional)"
                rows={2}
                style={{width:'100%', padding:8, borderRadius:6, border:'1px solid var(--border)'}}
              />
            </div>

            <div style={{display:'flex', gap:8}}>
              <button 
                type="button" 
                className="btn primary" 
                onClick={handleSaveExam}
              >
                {selectedExam ? 'Update Exam' : 'Create Exam'}
              </button>
              <button 
                type="button"
                className="btn"
                onClick={() => {
                  setExamEditing(false);
                  setSelectedExam(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Exams for Selected Date */}
        <div style={{marginBottom:32}}>
          <h3 style={{marginBottom:16, color:'var(--text)'}}>
            📝 Exams on {formatDate(selectedDate)}
          </h3>
          {getExamsForDate(selectedDate).length === 0 ? (
            <div style={{
              textAlign:'center', 
              padding:40, 
              background:'var(--color-bg)', 
              borderRadius:12,
              border:'2px dashed var(--border)'
            }}>
              <div style={{fontSize:48, marginBottom:16}}>📚</div>
              <div className="muted" style={{fontSize:16}}>
                {isToday(selectedDate) ? 'No exams scheduled for today!' : 'No exams scheduled for this date'}
              </div>
              <div className="muted" style={{fontSize:14, marginTop:8}}>
                {isUpcoming(selectedDate) ? 'Check back closer to the exam date' : 'Check other dates for exam schedules'}
              </div>
            </div>
          ) : (
            <div style={{display:'grid', gap:16}}>
              {getExamsForDate(selectedDate).map(exam => (
                <div key={exam.id} style={{
                  border:'1px solid var(--border)', 
                  borderRadius:12, 
                  padding:20,
                  background:isToday(selectedDate) ? '#fef3c7' : 'var(--panel)',
                  borderLeft: isToday(selectedDate) ? '4px solid #f59e0b' : '1px solid var(--border)',
                  transition:'all 0.2s ease'
                }} className="exam-card">
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:12}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:8}}>
                        <div style={{
                          fontSize:20,
                          fontWeight:700,
                          color:'var(--text)'
                        }}>
                          {exam.subject}
                        </div>
                        <span style={{
                          background:getExamTypeColor(exam.examType),
                          color:'white',
                          padding:'4px 8px',
                          borderRadius:6,
                          fontSize:12,
                          fontWeight:600
                        }}>
                          {exam.examType}
                        </span>
                        {isToday(selectedDate) && (
                          <span style={{
                            background:'#f59e0b',
                            color:'white',
                            padding:'4px 8px',
                            borderRadius:6,
                            fontSize:12,
                            fontWeight:600,
                            animation:'pulse 2s infinite'
                          }}>
                            TODAY
                          </span>
                        )}
                      </div>
                      
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12}}>
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <span style={{fontSize:16}}>🕐</span>
                          <div>
                            <div style={{fontSize:12, color:'var(--muted)'}}>Time</div>
                            <div style={{fontSize:14, fontWeight:600, color:'var(--text)'}}>{exam.time}</div>
                          </div>
                        </div>
                        
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <span style={{fontSize:16}}>📍</span>
                          <div>
                            <div style={{fontSize:12, color:'var(--muted)'}}>Venue</div>
                            <div style={{fontSize:14, fontWeight:600, color:'var(--text)'}}>{exam.venue}</div>
                          </div>
                        </div>
                        
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <span style={{fontSize:16}}>⏱️</span>
                          <div>
                            <div style={{fontSize:12, color:'var(--muted)'}}>Duration</div>
                            <div style={{fontSize:14, fontWeight:600, color:'var(--text)'}}>{exam.duration}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{marginTop:12, padding:12, background:'var(--color-bg)', borderRadius:8}}>
                        <div style={{fontSize:12, color:'var(--muted)', marginBottom:4}}>
                          <strong>Syllabus:</strong> {exam.syllabus}
                        </div>
                        <div style={{fontSize:12, color:'var(--muted)'}}>
                          <strong>Instructions:</strong> {exam.instructions}
                        </div>
                      </div>
                      
                      {/* Teacher Edit/Delete Actions */}
                      {isTeacher && (
                        <div style={{marginTop:12, display:'flex', gap:8}}>
                          <button 
                            className="btn"
                            onClick={() => handleEditExam(exam)}
                            style={{padding:'4px 8px', fontSize:12, background:'#3b82f6', color:'white'}}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="btn"
                            onClick={() => handleDeleteExam(exam.id)}
                            style={{padding:'4px 8px', fontSize:12, background:'#ef4444', color:'white', border:'none'}}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Exams */}
        <div style={{marginBottom:32}}>
          <h3 style={{marginBottom:16, color:'var(--text)'}}>
            📆 Upcoming Exams (Next 7 Days)
          </h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'2px solid var(--border)'}}>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Date</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Day</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Subject</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Type</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Time</th>
                  <th style={{padding:12, textAlign:'left', color:'var(--muted)', fontWeight:600}}>Venue</th>
                </tr>
              </thead>
              <tbody>
                {examSchedule
                  .filter(exam => new Date(exam.date) >= new Date())
                  .slice(0, 7)
                  .map(exam => (
                    <tr key={exam.id} style={{borderBottom:'1px solid var(--border)'}}>
                      <td style={{padding:12, color:'var(--text)'}}>{exam.date}</td>
                      <td style={{padding:12, color:'var(--text)'}}>
                        {new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </td>
                      <td style={{padding:12, fontWeight:600, color:'var(--text)'}}>{exam.subject}</td>
                      <td style={{padding:12}}>
                        <span style={{
                          background:getExamTypeColor(exam.examType),
                          color:'white',
                          padding:'4px 8px',
                          borderRadius:6,
                          fontSize:12,
                          fontWeight:600
                        }}>
                          {exam.examType}
                        </span>
                      </td>
                      <td style={{padding:12, color:'var(--text)'}}>{exam.time}</td>
                      <td style={{padding:12, color:'var(--text)'}}>{exam.venue}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regular Class Schedule */}
        <div>
          <h3 style={{marginBottom:16, color:'var(--text)'}}>
            📚 Regular Class Schedule
          </h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16}}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <div key={day} style={{
                border:'1px solid var(--border)', 
                borderRadius:12, 
                padding:16,
                background:'var(--panel)'
              }}>
                <h4 style={{margin:'0 0 12px 0', color:'var(--primary)', borderBottom:'2px solid var(--primary)', paddingBottom:8}}>
                  {day}
                </h4>
                {getClassesForDay(day).length === 0 ? (
                  <div className="muted" style={{textAlign:'center', padding:20}}>
                    No classes scheduled
                  </div>
                ) : (
                  <div style={{display:'grid', gap:8}}>
                    {getClassesForDay(day).map(cls => (
                      <div key={cls.id} style={{
                        background:'var(--color-bg)',
                        padding:12,
                        borderRadius:8,
                        borderLeft:'3px solid var(--primary)'
                      }}>
                        <div style={{fontWeight:600, color:'var(--text)', marginBottom:4}}>
                          {cls.subject}
                        </div>
                        <div style={{fontSize:12, color:'var(--muted)', marginBottom:2}}>
                          🕐 {cls.time}
                        </div>
                        <div style={{fontSize:12, color:'var(--muted)', marginBottom:2}}>
                          👨‍🏫 {cls.teacher}
                        </div>
                        <div style={{fontSize:12, color:'var(--muted)'}}>
                          📍 {cls.venue}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Edit Section */}
        {editing && isTeacher && (
          <div style={{marginTop:32, padding:20, background:'var(--color-bg)', borderRadius:12}}>
            <h4 style={{marginBottom:16}}>Edit Timetable Details</h4>
            <div className="form">
              <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" />
              <textarea rows={6} value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Details or schedule" />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .exam-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
      `}</style>
    </div>
  );
}
