import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AssignmentsAPI, CoursesAPI, CertificatesAPI, ActivityAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CourseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editCourse, setEditCourse] = useState({ title: '', description: '', duration: '', content: '' });
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);

  const isTeacher = useMemo(() => (user?.role || '').toLowerCase() === 'teacher', [user]);

  const load = async () => {
    setLoading(true);
    setEnrollmentLoading(true);
    setError('');
    try {
      const [{ data: courseRes }, { data: aRes }] = await Promise.all([
        CoursesAPI.get(id),
        AssignmentsAPI.listByCourse(id),
      ]);
      setCourse(courseRes.course || courseRes);
      setAssignments(aRes.assignments || []);
      
      if (isTeacher) {
        const { data: rRes } = await CoursesAPI.roster(id);
        setRoster(rRes.students || []);
      } else if (user) {
        // Check enrollment status
        try {
          const { data: mine } = await CoursesAPI.myEnrollments();
          const enrollments = mine.enrollments || [];
          const enrollment = enrollments.find(e => e.course?._id === id);
          
          if (enrollment) {
            setIsEnrolled(true);
            setIsCompleted(enrollment.status === 'completed');
          } else {
            setIsEnrolled(false);
            setIsCompleted(false);
          }
        } catch (enrollmentError) {
          console.log('Could not fetch enrollment status:', enrollmentError);
          setIsEnrolled(false);
          setIsCompleted(false);
        }
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
      setEnrollmentLoading(false);
    }
  };

  const addTextAttachment = async (assignmentId) => {
    const name = window.prompt('Enter file name (e.g., notes.txt)');
    if (!name) return;
    const content = window.prompt('Paste or type the file content');
    if (content == null) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const reader = new FileReader();
    reader.onload = () => {
      setAttachments(prev => {
        const list = Array.isArray(prev[assignmentId]) ? prev[assignmentId].slice() : [];
        list.push({ name, mime: 'text/plain', size: blob.size, data: String(reader.result || '') });
        return { ...prev, [assignmentId]: list };
      });
    };
    reader.readAsDataURL(blob);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, isTeacher]);

  const enroll = async () => {
    try {
      if (isEnrolled) return;
      await CoursesAPI.enroll(id);
      await load();
      alert('Thank you for enrolled');
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to enroll');
    }
  };

  const completeCourse = async () => {
    if (!window.confirm('Are you sure you want to mark this course as completed? This will generate your certificate.')) {
      return;
    }
    
    setCompleting(true);
    try {
      // Generate a grade first (in a real app, this would be based on assignments/exams)
      const grades = ['A+', 'A', 'B+', 'B', 'C'];
      const randomGrade = grades[Math.floor(Math.random() * grades.length)];
      
      console.log('Attempting to complete course:', id, 'with grade:', randomGrade);
      
      // Call the course completion API with grade (will auto-enroll if needed)
      const response = await CoursesAPI.complete(id, { grade: randomGrade });
      console.log('Course completion response:', response);
      
      setIsCompleted(true);
      setIsEnrolled(true);
      
      // Show success message and immediately display certificate
      alert(`🎉 Congratulations! Course completed successfully! Your certificate has been generated with grade: ${randomGrade}. Your certificate will open in a new window.`);
      
      // Generate and display certificate immediately
      setTimeout(() => {
        generateCertificateForCourse(course?.title || 'Course', randomGrade);
      }, 500);
      
      // Also redirect to courses page after a delay
      setTimeout(() => {
        window.location.href = '/courses';
      }, 3000);
    } catch (e) {
      console.error('Course completion error:', e);
      let errorMessage = 'Failed to complete course';
      
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.response?.status === 404) {
        errorMessage = 'Course not found. Please refresh the page and try again.';
      } else if (e?.response?.status === 403) {
        errorMessage = 'You do not have permission to complete this course.';
      } else if (e?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      alert(errorMessage);
    } finally {
      setCompleting(false);
    }
  };

  const handleSimulate = async (type) => {
    try {
      await ActivityAPI.log({
        activityType: type,
        courseId: id
      });
      alert(`Successfully simulated action: ${type.replace('_', ' ')}`);
    } catch (err) {
      alert('Simulation log failed');
    }
  };

  const generateCertificateForCourse = (courseName, grade) => {
    const certWindow = window.open('', '_blank', 'width=800,height=600');
    certWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate of Completion - ${courseName}</title>
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: 'Georgia', serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .certificate {
            background: white;
            width: 800px;
            height: 600px;
            padding: 40px;
            border: 10px solid #gold;
            border-image: linear-gradient(45deg, #ffd700, #ffed4e) 1;
            position: relative;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            font-family: 'Georgia', serif;
          }
          .certificate::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border: 2px solid #ddd;
            pointer-events: none;
          }
          .logo {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .seal {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            border: 3px solid #2563eb;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #2563eb;
            font-weight: bold;
          }
          .title {
            font-size: 48px;
            font-weight: bold;
            color: #1a1a1a;
            margin: 60px 0 20px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .subtitle {
            font-size: 24px;
            color: #666;
            margin-bottom: 40px;
          }
          .recipient {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin: 30px 0;
            border-bottom: 2px solid #2563eb;
            display: inline-block;
            padding: 0 20px 10px 20px;
          }
          .course-name {
            font-size: 20px;
            color: #333;
            margin: 20px 0;
            font-style: italic;
          }
          .completion-text {
            font-size: 16px;
            color: #666;
            margin: 20px 0;
            line-height: 1.6;
          }
          .date {
            font-size: 16px;
            color: #333;
            margin: 30px 0;
            font-weight: bold;
          }
          .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 60px;
          }
          .signature {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-bottom: 1px solid #333;
            margin-bottom: 5px;
            height: 40px;
          }
          .signature-title {
            font-size: 12px;
            color: #666;
          }
          .certificate-id {
            position: absolute;
            bottom: 20px;
            right: 20px;
            font-size: 12px;
            color: #999;
          }
          .background-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0.05;
            background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.5) 35px, rgba(255,255,255,.5) 70px);
            pointer-events: none;
          }
          .grade {
            position: absolute;
            top: 50%;
            right: 30px;
            transform: translateY(-50%);
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            padding: 10px;
            border: 2px solid #2563eb;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="background-pattern"></div>
          <div class="logo">
            <div style="font-size: 28px; font-weight: bold; color: #2563eb; display: flex; align-items: center; gap: 8px;">
              🎓 Lumina LMS
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              Learning Management System
            </div>
          </div>
          <div class="seal">
            <div style="font-size: 14px; font-weight: bold; text-align: center; line-height: 1.2;">
              CERTIFIED
            </div>
            <div style="font-size: 10px; margin-top: 2px;">LUMINA</div>
            <div style="font-size: 8px;">LMS</div>
            <div style="font-size: 6px; margin-top: 1px;">2026</div>
          </div>
          
          <div class="title" style="font-size: 48px; font-weight: bold; color: #1a1a1a; margin: 60px 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">Certificate of Completion</div>
          <div class="subtitle" style="font-size: 24px; color: #666; margin-bottom: 40px;">is to certify that</div>
          
          <div class="recipient" style="font-size: 32px; font-weight: bold; color: #2563eb; margin: 30px 0; border-bottom: 2px solid #2563eb; display: inline-block; padding: 0 20px 10px 20px;">${user?.name || 'Student Name'}</div>
          
          <div class="course-name" style="font-size: 20px; color: #333; margin: 20px 0; font-style: italic;">has successfully completed the course</div>
          <div style="font-size: 24px; font-weight: bold; color: #1a1a1a; margin: 20px 0;">
            "${courseName}"
          </div>
          
          <div class="completion-text" style="font-size: 16px; color: #666; margin: 20px 0; line-height: 1.6;">
            with distinction and has demonstrated mastery of the subject matter.<br>
            This achievement reflects dedication, perseverance, and academic excellence.
          </div>
          
          <div class="date" style="font-size: 16px; color: #333; margin: 30px 0; font-weight: bold;">Awarded on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          
          <div class="grade">Grade: ${grade}</div>
          
          <div class="signatures">
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-title">Course Instructor</div>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-title">Academic Director</div>
            </div>
          </div>
          
          <div class="certificate-id">Certificate ID: CERT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
          
          <div style="position: absolute; bottom: 20px; left: 20px; font-size: 10px; color: #999; text-align: left;">
            <div style="font-weight: bold; color: #2563eb;">Lumina LMS</div>
            <div>Learning Management System</div>
            <div>www.lumina-lms.com</div>
          </div>
        </div>
      </body>
      </html>
    `);
    certWindow.document.close();
  };

  const [newAssign, setNewAssign] = useState({ title: '', description: '', dueDate: '' });

  const createAssignment = async (e) => {
    e.preventDefault();
    try {
      await AssignmentsAPI.create(id, newAssign);
      setNewAssign({ title: '', description: '', dueDate: '' });
      await load();
    } catch (e2) {
      alert(e2?.response?.data?.message || 'Failed to create assignment');
    }
  };

  const [submissionText, setSubmissionText] = useState({});
  const [attachments, setAttachments] = useState({}); // assignmentId -> [{name,mime,size,data}]
  const fileRef = useRef(null);
  const uploadFor = useRef(null); // assignmentId awaiting files
  const [attachMenuFor, setAttachMenuFor] = useState(null);

  const readFilesAsDataUrls = (files) => Promise.all(Array.from(files).slice(0,5).map(f => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res({ name: f.name, mime: f.type, size: f.size, data: String(reader.result||'') });
    reader.onerror = rej;
    reader.readAsDataURL(f);
  })));

  const handlePickFiles = (assignmentId) => {
    uploadFor.current = assignmentId;
    fileRef.current?.click();
  };

  const onFilesChosen = async (e) => {
    const files = e.target.files;
    if (!files || !uploadFor.current) return;
    try {
      const dataUrls = await readFilesAsDataUrls(files);
      setAttachments(prev => ({ ...prev, [uploadFor.current]: dataUrls }));
    } finally {
      try { e.target.value = ''; } catch(_) {}
      uploadFor.current = null;
    }
  };

  const submitAssignment = async (assignmentId) => {
    try {
      await AssignmentsAPI.submit(id, assignmentId, {
        content: submissionText[assignmentId] || '',
        attachments: attachments[assignmentId] || [],
      });
      
      // Log submission activity
      await ActivityAPI.log({
        activityType: 'assignment_submitted',
        courseId: id
      }).catch(err => console.error('Failed to log submission:', err));

      await load();
      alert('Submitted');
    } catch (e3) {
      alert(e3?.response?.data?.message || 'Failed to submit');
    }
  };

  // Teacher submissions UI removed; grading is available in Submissions page

  if (loading) return <div className="container"><div className="card">Loading...</div></div>;
  if (error) return <div className="container"><div className="alert danger">{error}</div></div>;
  if (!course) return null;

  const doEdit = () => {
    if (!course) return;
    setEditCourse({ title: course.title || '', description: course.description || '', duration: course.duration || '', content: course.content || '' });
    setEditing(true);
  };

  const saveCourse = async (e) => {
    e.preventDefault();
    try {
      await CoursesAPI.update(id, editCourse);
      setEditing(false);
      await load();
    } catch (e2) {
      alert(e2?.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <div className="container">
      <div className="row" style={{marginTop:16, marginBottom:12}}>
        <h2 style={{margin:0}}>{course.title}</h2>
        <span className="tag">{course.duration || 'N/A'}</span>
        {isTeacher && (
          <div style={{marginLeft:'auto', display:'flex', gap:8}}>
            <a href="#create-assignment" className="btn">Add assignment</a>
            <button className="btn" onClick={doEdit}>Edit</button>
            <button className="btn danger" title="Delete course" onClick={async()=>{
              if (!window.confirm('Delete this course? This cannot be undone.')) return;
              try { await CoursesAPI.delete(id); nav('/courses', { replace: true }); } catch(e){ alert(e?.response?.data?.message || 'Failed to delete course'); }
            }}>🗑️</button>
          </div>
        )}

      {isTeacher && !course.teacher && (
        <div className="card" style={{marginBottom:16, borderColor:'#fde68a', background:'#fffbeb'}}>
          <div className="row">
            <div>
              <div style={{fontWeight:600}}>This course has no owner</div>
              <div className="muted">Claim ownership to manage submissions and edits.</div>
            </div>
            <button className="btn" onClick={async()=>{ try{ await CoursesAPI.claim(id); await load(); } catch(e){ alert(e?.response?.data?.message || 'Failed to claim'); } }}>Claim ownership</button>
          </div>
        </div>
      )}
      </div>
      {!editing ? (
        <div className="card" style={{marginBottom:16}}>
          <p className="muted" style={{marginTop:0}}>{course.description}</p>
          {course.content && (
            <div style={{marginTop:10}}>
              <h3 style={{marginTop:0}}>Content</h3>
              <div style={{whiteSpace:'pre-wrap'}}>{course.content}</div>
            </div>
          )}
          {!isTeacher && (
            isEnrolled ? (
              isCompleted ? (
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <button className="btn" disabled style={{background:'#10b981', color:'white'}}>
                    ✅ Completed
                  </button>
                  <span className="muted" style={{fontSize:12}}>
                    Certificate generated! Check your profile.
                  </span>
                </div>
              ) : (
                <button 
                  className="btn primary" 
                  onClick={completeCourse}
                  disabled={completing}
                  style={{background:'#10b981', color:'white'}}
                >
                  {completing ? 'Processing...' : '🎓 Mark as Complete'}
                </button>
              )
            ) : (
              <button className="btn primary" onClick={enroll}>Enroll</button>
            )
          )}
          {isEnrolled && !isTeacher && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
                <span>🎮</span> Interactive Study Console (Simulate Actions)
              </h3>
              <p className="muted" style={{ fontSize: '0.85rem' }}>
                Simulate standard learning actions to test real-time student activity tracking.
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                <button className="btn" onClick={() => handleSimulate('lesson_started')}>📖 Start Lesson</button>
                <button className="btn" onClick={() => handleSimulate('lesson_completed')}>✅ Complete Lesson</button>
                <button className="btn" onClick={() => handleSimulate('quiz_started')}>📝 Start Quiz</button>
                <button className="btn" onClick={() => handleSimulate('quiz_submitted')}>✅ Submit Quiz</button>
                <button className="btn" onClick={() => handleSimulate('video_started')}>🎥 Play Video</button>
                <button className="btn" onClick={() => handleSimulate('video_paused')}>⏸️ Pause Video</button>
                <button className="btn" onClick={() => handleSimulate('video_completed')}>✅ Finish Video</button>
                <button className="btn" onClick={() => handleSimulate('file_downloaded')}>💾 Download File</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{marginBottom:16}}>
          <h3 style={{marginTop:0}}>Edit course</h3>
          <form className="form" onSubmit={saveCourse}>
            <label>Title</label>
            <input value={editCourse.title} onChange={(e)=>setEditCourse({...editCourse,title:e.target.value})} required />
            <label>Description</label>
            <textarea rows={3} value={editCourse.description} onChange={(e)=>setEditCourse({...editCourse,description:e.target.value})} />
            <label>Duration</label>
            <input value={editCourse.duration} onChange={(e)=>setEditCourse({...editCourse,duration:e.target.value})} />
            <label>Content</label>
            <textarea rows={8} value={editCourse.content} onChange={(e)=>setEditCourse({...editCourse,content:e.target.value})} />
            <div style={{display:'flex', gap:8}}>
              <button className="btn primary" type="submit">Save</button>
              <button className="btn" type="button" onClick={()=>setEditing(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isTeacher && (
        <div id="create-assignment" className="card" style={{marginBottom:16}}>
          <h3 style={{marginTop:0}}>Create Assignment</h3>
          <form className="form" onSubmit={createAssignment}>
            <label>Title</label>
            <input value={newAssign.title} onChange={(e)=>setNewAssign({...newAssign,title:e.target.value})} required />
            <label>Description</label>
            <textarea rows={3} value={newAssign.description} onChange={(e)=>setNewAssign({...newAssign,description:e.target.value})} />
            <label style={{marginTop:8}}>Due Date</label>
            <input type="date" value={newAssign.dueDate || ''} onChange={(e)=>setNewAssign({...newAssign,dueDate:e.target.value})} />
            <button className="btn primary" style={{marginTop:8}}>Create</button>
          </form>
        </div>
      )}

      <div className="grid">
        {assignments.map(a => (
          <div key={a._id} className="card">
            <div className="row">
              <h3 style={{margin:0}}>{a.title}</h3>
              {isTeacher && (
                <button className="btn" title="Delete assignment" onClick={async()=>{
                  if (!window.confirm('Delete this assignment?')) return;
                  try { await AssignmentsAPI.delete(id, a._id); await load(); } catch(e){ alert(e?.response?.data?.message || 'Failed to delete'); }
                }}>🗑️</button>
              )}
            </div>
            <p className="muted">{a.description}</p>

            {!isTeacher && (
              <div style={{marginTop:8}}>
                <label>Your Submission</label>
                {/* hidden file input for attachments */}
                <input ref={fileRef} type="file" multiple onChange={onFilesChosen} accept="*/*,.pdf" style={{display:'none'}} />
                <div style={{position:'relative', display:'block', width:'100%'}}>
                  <textarea
                    rows={3}
                    style={{ color:'#000000', paddingRight:44, width:'100%', maxWidth:'100%', boxSizing:'border-box', resize:'vertical' }}
                    value={submissionText[a._id] || ''}
                    onChange={(e)=>setSubmissionText({...submissionText,[a._id]:e.target.value})}
                    placeholder="Type your answer here"
                  />
                  {/* Plus button inside the textarea container at bottom-right */}
                  <button
                    type="button"
                    className="btn"
                    title="Add"
                    onClick={()=>setAttachMenuFor(v => v===a._id ? null : a._id)}
                    style={{position:'absolute', right:10, bottom:10, zIndex:2, width:28, height:28, padding:0, borderRadius:9999, display:'inline-flex', alignItems:'center', justifyContent:'center'}}
                  >+
                  </button>
                  {attachMenuFor === a._id && (
                    <div className="card" style={{position:'absolute', right:10, bottom:48, zIndex:5, padding:8, display:'grid', gap:6, maxWidth:'calc(100% - 20px)'}}>
                      <button className="btn" onClick={()=>{ setAttachMenuFor(null); addTextAttachment(a._id); }}>Create a file</button>
                      <button className="btn" onClick={()=>{ setAttachMenuFor(null); handlePickFiles(a._id); }}>Upload a file</button>
                    </div>
                  )}
                </div>
                {/* attachments preview */}
                {Array.isArray(attachments[a._id]) && attachments[a._id].length > 0 && (
                  <div className="muted small" style={{marginTop:6}}>
                    Attachments: {attachments[a._id].map(x=>x.name).join(', ')}
                  </div>
                )}
                {/* Submit button below */}
                <div style={{marginTop:8}}>
                  <button
                    className="btn"
                    onClick={()=>{
                      const content = (submissionText[a._id]||'').trim();
                      if (!content) { alert('Please type your answer before submitting.'); return; }
                      submitAssignment(a._id);
                    }}
                  >Submit</button>
                </div>
              </div>
            )}

            {/* Teacher submissions UI removed; see /submissions */}
          </div>
        ))}
        {assignments.length === 0 && (
          isTeacher ? (
            <div className="card" style={{display:'grid',placeItems:'center',padding:24}}>
              <a href="#create-assignment" className="btn primary" style={{minWidth:220,textAlign:'center'}}>Create assignment</a>
            </div>
          ) : (
            <div className="card">No assignments was found.</div>
          )
        )}
      </div>

      
    </div>
  );
}
