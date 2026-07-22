import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CertificatesAPI } from '../api/client';
import { CoursesAPI, AssignmentsAPI, AttendanceAPI } from '../api/client';

export default function Profile(){
  const { user, updateMe } = useAuth();
  const [avatarUrl] = useState(() => localStorage.getItem('avatarUrl') || '');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]); // student graded results
  const [myEnrolls, setMyEnrolls] = useState([]); // {course, joinedAt}
  const [editing, setEditing] = useState(false);
  const [nameEdit, setNameEdit] = useState('');
  const [rollEdit, setRollEdit] = useState('');
  const [teacherIdEdit, setTeacherIdEdit] = useState('');
  const [saveErr, setSaveErr] = useState('');
  const [saveOk, setSaveOk] = useState('');
  const [showMyLearning, setShowMyLearning] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showCertificates, setShowCertificates] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          let w = img.width;
          let h = img.height;
          if (w > h) {
            if (w > maxDim) {
              h = Math.round(h * (maxDim / w));
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round(w * (maxDim / h));
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          
          try {
            await updateMe({ profileImage: compressedBase64 });
            showToast('Profile photo updated successfully!', 'success');
          } catch (err) {
            showToast('Failed to upload photo.', 'error');
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate course progress
  const getCourseProgress = (courseId) => {
    const courseGrades = grades.filter(g => g.course?._id === courseId);
    const totalAssignments = courses.find(c => c._id === courseId)?.assignments?.length || 0;
    const completedAssignments = courseGrades.length;
    
    if (totalAssignments === 0) return { status: 'enrolled', progress: 0 };
    const progress = Math.round((completedAssignments / totalAssignments) * 100);
    
    if (progress === 0) return { status: 'enrolled', progress };
    if (progress < 100) return { status: 'in-progress', progress };
    return { status: 'completed', progress };
  };

  // Get earned badges based on grades and achievements
  const getEarnedBadges = () => {
    const badges = [];
    
    // Grade-based badges
    const excellentGrades = grades.filter(g => g.grade === 'A' || g.grade === 'A+').length;
    const goodGrades = grades.filter(g => g.grade === 'B' || g.grade === 'B+').length;
    
    if (excellentGrades >= 5) badges.push({ name: '🏆 Excellence', description: '5+ Excellent grades', color: '#fbbf24' });
    if (goodGrades >= 3) badges.push({ name: '⭐ Achiever', description: '3+ Good grades', color: '#60a5fa' });
    
    // Course completion badges
    const completedCourses = myEnrolls.filter(e => getCourseProgress(e.course._id).status === 'completed').length;
    if (completedCourses >= 1) badges.push({ name: '🎓 Graduate', description: 'Completed a course', color: '#34d399' });
    if (completedCourses >= 3) badges.push({ name: '👨‍🎓 Scholar', description: 'Completed 3+ courses', color: '#a78bfa' });
    
    // Enrollment badge
    if (myEnrolls.length >= 1) badges.push({ name: '📚 Learner', description: 'Enrolled in courses', color: '#f87171' });
    
    return badges;
  };

  // Get earned certificates from API
  const getEarnedCertificates = () => {
    console.log('Getting earned certificates from:', certificates);
    return certificates.map(cert => ({
      _id: cert._id,
      courseName: cert.courseName,
      completionDate: new Date(cert.completionDate).toLocaleDateString(),
      certificateId: cert.certificateId,
      grade: cert.grade,
      template: cert.template,
      status: cert.status
    }));
  };

  useEffect(()=>{
    const load = async()=>{
      try{
        const role = (user?.role||'').toLowerCase();
        console.log('Loading profile data for role:', role);
        if (user && role === 'student'){
          const [{ data: all }, { data: mine }, g, certs] = await Promise.all([
            CoursesAPI.list(),
            CoursesAPI.myEnrollments(),
            AssignmentsAPI.myGrades().catch(()=>({ data:{ grades:[] } })),
            CertificatesAPI.list().catch(()=>({ data:{ certificates:[] } }))
          ]);
          console.log('Certificate API response:', certs);
          console.log('Certificates data:', certs?.data?.certificates);
          setCourses(all.courses || []);
          setMyEnrolls((mine.enrollments || []).filter(e=>e?.course));
          setGrades((g?.data?.grades) || []);
          setCertificates((certs?.data?.certificates) || []);
        }
      } finally { 
        setLoading(false);
        setCertificatesLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return (
    <div className="container" style={{padding:24}}>
      <div className="card">
        <div>Please log in.</div>
        <div style={{marginTop:12}}>
          <Link to="/login" className="btn primary">Go to Login</Link>
        </div>
      </div>
    </div>
  );
  return (
    <div className="container" style={{padding: '0 24px 24px 24px', maxWidth: '1400px', margin: '0 auto'}}>
      
      {/* Comprehensive Profile Overview */}
      <div className="card fade-in-up" style={{ padding: '0', overflow: 'hidden', border: 'none', background: 'var(--panel)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 300px) 1fr', gap: '32px' }}>
            
            {/* Left: Profile Photo & Upload Option */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <div style={{
                width: '100%',
                aspectRatio: '3/4',
                backgroundColor: 'var(--bg)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {user?.profileImage || avatarUrl ? (
                  <img src={user?.profileImage || avatarUrl} alt={`${user.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: '4rem', color: 'var(--muted)', opacity: 0.5 }}>📸</div>
                )}
              </div>
              
              {/* File Upload Button */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label 
                  htmlFor="profile-photo-upload" 
                  className="btn primary" 
                  style={{ 
                    cursor: 'pointer', 
                    fontSize: '0.85rem', 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    width: '100%', 
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    display: 'inline-block'
                  }}
                >
                  📤 Upload Photo
                </label>
                <input 
                  type="file" 
                  id="profile-photo-upload" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handlePhotoUpload} 
                />
              </div>
            </div>

            {/* Right: Academic Details */}
            <div>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '1.4rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {user?.name || 'STUDENT NAME'}
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', fontSize: '0.9rem', color: 'var(--text)' }}>
                <div style={{ color: 'var(--muted)' }}>Account Role</div>
                <div style={{textTransform:'capitalize'}}>: {user?.role || '-'}</div>

                <div style={{ color: 'var(--muted)' }}>Email Address</div>
                <div>: {user?.email || '-'}</div>

                <div style={{ color: 'var(--muted)' }}>Mobile Number</div>
                <div>: {user?.mobileNumber || '-'}</div>

                {(user.role || '').toLowerCase() === 'student' ? (
                  <>
                    <div style={{ color: 'var(--muted)' }}>Roll No.</div>
                    <div>: {user?.rollNo || '-'}</div>
                  </>
                ) : (
                  <>
                    <div style={{ color: 'var(--muted)' }}>Teacher ID</div>
                    <div>: {user?.teacherId || '-'}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Edit Profile for both students and teachers */}
      {user && (
        <div className="card" style={{maxWidth:720, margin:'16px auto 0'}}>
          <div className="row" style={{alignItems:'center'}}>
            <h3 style={{marginTop:0}}>Edit Profile</h3>
            <button className="btn" onClick={()=>{ setEditing(e=>!e); setNameEdit(user.name||''); setRollEdit(user.rollNo||''); setTeacherIdEdit(user.teacherId||''); }}>
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editing && (
            <form className="form" onSubmit={async(e)=>{ e.preventDefault();
              try{ 
                const payload = { name: nameEdit };
                if ((user.role||'').toLowerCase()==='student') {
                  payload.rollNo = rollEdit;
                }
                if ((user.role||'').toLowerCase()==='teacher') {
                  if (!/^\d{10}$/.test(teacherIdEdit)) {
                    showToast('Teacher ID must be exactly 10 digits', 'error');
                    return;
                  }
                  payload.teacherId = teacherIdEdit;
                }
                await updateMe(payload); 
                showToast('Profile updated successfully!', 'success');
                setEditing(false); 
              }
              catch(err){ showToast(err?.response?.data?.message || 'Failed to update', 'error'); }
            }}>
              <label>Name</label>
              <input value={nameEdit} onChange={(e)=>setNameEdit(e.target.value)} required />
              {(String(user.role||'').toLowerCase()==='student') && (
                <>
                  <label>Roll no</label>
                  <input value={rollEdit} onChange={(e)=>setRollEdit(e.target.value)} />
                </>
              )}
              {(String(user.role||'').toLowerCase()==='teacher') && (
                <>
                  <label>Teacher ID (10 digits)</label>
                  <input value={teacherIdEdit} onChange={(e)=>setTeacherIdEdit(e.target.value)} maxLength={10} />
                </>
              )}
              <button className="btn primary">Save</button>
            </form>
          )}
        </div>
      )}

      {/* Student Action Buttons */}
      {(user.role||'').toLowerCase()==='student' && (
        <div className="card" style={{maxWidth:720, margin:'16px auto 0'}}>
          <h3 style={{marginTop:0, marginBottom:20}}>🎯 Quick Actions</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12}}>
            <button 
              className={`btn ${showMyLearning ? 'primary' : ''}`}
              onClick={() => {
                setShowMyLearning(!showMyLearning);
                setShowBadges(false);
                setShowCertificates(false);
              }}
              style={{padding:12, borderRadius:8, display:'flex', alignItems:'center', gap:8}}
            >
              📚 My Learning
            </button>
            <button 
              className={`btn ${showBadges ? 'primary' : ''}`}
              onClick={() => {
                setShowBadges(!showBadges);
                setShowMyLearning(false);
                setShowCertificates(false);
              }}
              style={{padding:12, borderRadius:8, display:'flex', alignItems:'center', gap:8}}
            >
              🏆 Badges
            </button>
            <button 
              className={`btn ${showCertificates ? 'primary' : ''}`}
              onClick={() => {
                setShowCertificates(!showCertificates);
                setShowMyLearning(false);
                setShowBadges(false);
              }}
              style={{padding:12, borderRadius:8, display:'flex', alignItems:'center', gap:8}}
            >
              🎓 Certificates
            </button>
            <Link to="/courses" className="btn" style={{padding:12, borderRadius:8, display:'flex', alignItems:'center', gap:8, justifyContent:'center', textDecoration:'none'}}>
              📖 Browse Courses
            </Link>
          </div>
        </div>
      )}

      {/* My Learning Section */}
      {(user.role||'').toLowerCase()==='student' && showMyLearning && (
        <div className="card" style={{maxWidth:720, margin:'16px auto 0'}}>
          <h3 style={{marginTop:0, marginBottom:20}}>📚 My Learning</h3>
          {loading ? (
            <div className="muted">Loading your learning progress...</div>
          ) : myEnrolls.length === 0 ? (
            <div style={{textAlign:'center', padding:40, background:'var(--color-bg)', borderRadius:12}}>
              <div style={{fontSize:48, marginBottom:16}}>🎓</div>
              <div className="muted" style={{fontSize:16}}>No courses enrolled yet</div>
              <div className="muted" style={{fontSize:14, marginTop:8}}>Start your learning journey!</div>
              <Link to="/courses" className="btn primary" style={{marginTop:16, display:'inline-block'}}>
                Browse Courses
              </Link>
            </div>
          ) : (
            <div style={{display:'grid', gap:16}}>
              {myEnrolls.map(e => {
                const progress = getCourseProgress(e.course._id);
                const statusColors = {
                  'enrolled': '#64748b',
                  'in-progress': '#3b82f6', 
                  'completed': '#10b981'
                };
                const statusIcons = {
                  'enrolled': '📝',
                  'in-progress': '📖',
                  'completed': '✅'
                };
                
                return (
                  <div key={e.course._id} style={{
                    border:'1px solid var(--border)', 
                    borderRadius:12, 
                    padding:16,
                    background:'var(--panel)',
                    transition:'all 0.2s ease'
                  }} className="learning-card">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:12}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600, fontSize:16, marginBottom:4, color:'var(--text)'}}>
                          {e.course.title}
                        </div>
                        <div className="muted" style={{fontSize:14, marginBottom:8}}>
                          {e.course.description}
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <span style={{
                            background:statusColors[progress.status],
                            color:'white',
                            padding:'4px 8px',
                            borderRadius:6,
                            fontSize:12,
                            fontWeight:600
                          }}>
                            {statusIcons[progress.status]} {progress.status.replace('-', ' ').toUpperCase()}
                          </span>
                          <span className="muted" style={{fontSize:12}}>
                            Joined {new Date(e.joinedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Link to={`/courses/${e.course._id}`} className="btn" style={{marginLeft:12}}>
                        Open Course
                      </Link>
                    </div>
                    
                    {progress.progress > 0 && (
                      <div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
                          <span style={{fontSize:12, color:'var(--muted)'}}>Progress</span>
                          <span style={{fontSize:12, fontWeight:600, color:'var(--text)'}}>{progress.progress}%</span>
                        </div>
                        <div style={{
                          width:'100%', 
                          height:8, 
                          background:'var(--border)', 
                          borderRadius:4,
                          overflow:'hidden'
                        }}>
                          <div style={{
                            width:`${progress.progress}%`,
                            height:'100%',
                            background:progress.status === 'completed' ? 'var(--success)' : 'var(--primary)',
                            borderRadius:4,
                            transition:'width 0.3s ease'
                          }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Badges Section */}
      {(user.role||'').toLowerCase()==='student' && showBadges && (
        <div className="card" style={{maxWidth:720, margin:'16px auto 0'}}>
          <h3 style={{marginTop:0, marginBottom:20}}>🏆 My Badges</h3>
          {loading ? (
            <div className="muted">Loading your badges...</div>
          ) : getEarnedBadges().length === 0 ? (
            <div style={{textAlign:'center', padding:40, background:'var(--color-bg)', borderRadius:12}}>
              <div style={{fontSize:48, marginBottom:16}}>🏆</div>
              <div className="muted" style={{fontSize:16}}>No badges earned yet</div>
              <div className="muted" style={{fontSize:14, marginTop:8}}>Complete courses and get good grades to earn badges!</div>
            </div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16}}>
              {getEarnedBadges().map((badge, index) => (
                <div key={index} style={{
                  border:'1px solid var(--border)', 
                  borderRadius:12, 
                  padding:16,
                  background:'var(--panel)',
                  textAlign:'center',
                  transition:'all 0.2s ease'
                }} className="badge-card">
                  <div style={{
                    width:60, 
                    height:60, 
                    borderRadius:'50%', 
                    background:badge.color,
                    display:'flex', 
                    alignItems:'center', 
                    justifyContent:'center',
                    margin:'0 auto 12px',
                    fontSize:24
                  }}>
                    {badge.name.split(' ')[0]}
                  </div>
                  <div style={{fontWeight:600, fontSize:14, marginBottom:4, color:'var(--text)'}}>
                    {badge.name}
                  </div>
                  <div className="muted" style={{fontSize:12}}>
                    {badge.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Certificates Section */}
      {(user.role||'').toLowerCase()==='student' && showCertificates && (
        <div className="card" style={{maxWidth:720, margin:'16px auto 0'}}>
          <h3 style={{marginTop:0, marginBottom:20}}>🎓 My Certificates</h3>
          {certificatesLoading ? (
            <div className="muted">Loading your certificates...</div>
          ) : getEarnedCertificates().length === 0 ? (
            <div style={{textAlign:'center', padding:40, background:'var(--color-bg)', borderRadius:12}}>
              <div style={{fontSize:48, marginBottom:16}}>🎓</div>
              <div className="muted" style={{fontSize:16, fontWeight: 'bold'}}>not yet completed</div>
            </div>
          ) : (
            <div style={{display:'grid', gap:16}}>
              {getEarnedCertificates().map((cert, index) => (
                <div key={index} style={{
                  border:'1px solid var(--border)', 
                  borderRadius:12, 
                  padding:20,
                  background:'var(--panel)',
                  display:'flex',
                  justifyContent:'space-between',
                  alignItems:'center',
                  transition:'all 0.2s ease',
                  cursor: 'pointer'
                }} className="certificate-card" 
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{flex: 1}}>
                    <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:8}}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: cert.template === 'excellence' ? '#fbbf24' : cert.template === 'achievement' ? '#60a5fa' : '#34d399',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: 'white'
                      }}>
                        🎓
                      </div>
                      <div>
                        <div style={{fontWeight:600, fontSize:16, marginBottom:2, color:'var(--text)'}}>
                          {cert.courseName}
                        </div>
                        <div style={{fontSize:12, color:'var(--muted)'}}>
                          Grade: <span style={{
                            fontWeight: 'bold',
                            color: cert.grade === 'A+' || cert.grade === 'A' ? '#10b981' : 
                                   cert.grade === 'B+' || cert.grade === 'B' ? '#3b82f6' : '#6b7280'
                          }}>{cert.grade}</span>
                        </div>
                      </div>
                    </div>
                    <div className="muted" style={{fontSize:13, marginBottom:4}}>
                      Certificate ID: {cert.certificateId}
                    </div>
                    <div className="muted" style={{fontSize:12}}>
                      Completed: {cert.completionDate} | Status: <span style={{
                        color: cert.status === 'issued' ? '#10b981' : '#6b7280',
                        fontWeight: 'bold'
                      }}>{cert.status}</span>
                    </div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end'}}>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: cert.template === 'excellence' ? '#fef3c7' : 
                                 cert.template === 'achievement' ? '#dbeafe' : '#d1fae5',
                      color: cert.template === 'excellence' ? '#92400e' : 
                             cert.template === 'achievement' ? '#1e40af' : '#065f46',
                      textTransform: 'uppercase'
                    }}>
                      {cert.template}
                    </div>
                    <button 
                      className="btn primary" 
                      style={{padding:'8px 16px', fontSize:13}}
                      onClick={() => {
                        // Show certificate template
                        const certWindow = window.open('', '_blank', 'width=800,height=600');
                        certWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>Certificate of Completion - ${cert.courseName}</title>
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
                                "${cert.courseName}"
                              </div>
                              
                              <div class="completion-text" style="font-size: 16px; color: #666; margin: 20px 0; line-height: 1.6;">
                                with distinction and has demonstrated mastery of the subject matter.<br>
                                This achievement reflects dedication, perseverance, and academic excellence.
                              </div>
                              
                              <div class="date" style="font-size: 16px; color: #333; margin: 30px 0; font-weight: bold;">Awarded on ${cert.completionDate ? new Date(cert.completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                              
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
                              
                              <div class="certificate-id">Certificate ID: ${cert.certificateId}</div>
                              
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
                      }}
                    >
                      📄 View
                    </button>
                    <button className="btn" style={{padding:'8px 16px'}}>
                      ⬇️ Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(user.role||'').toLowerCase()==='student' && (
        <StudentAttendanceCard />
      )}

      {(user.role||'').toLowerCase()==='student' && (
        <div className="card" style={{maxWidth:720, margin:'16px auto 0'}}>
          <h3 style={{marginTop:0}}>My Grades</h3>
          {grades.length === 0 ? (
            <div className="muted">No grades yet.</div>
          ) : (
            <div className="list">
              {grades.map(g => (
                <div key={g._id} className="row">
                  <div>
                    <div style={{fontWeight:600}}>{g.assignment?.title || 'Assignment'}</div>
                    <div className="muted">Course: {g.course?.title || 'N/A'}</div>
                  </div>
                  <div className="tag">Grade: {g.grade}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          padding: '16px 24px',
          borderRadius: '8px',
          backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444',
          color: 'white',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontWeight: '700',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

    </div>
  );
}

function StudentAttendanceCard(){
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10));
  const [status, setStatus] = useState('');
  useEffect(()=>{
    let alive = true;
    (async()=>{
      try{
        const { data } = await AttendanceAPI.myForDate(date);
        if (!alive) return;
        setStatus(String(data?.status||'').toLowerCase());
      }catch{ if (alive) setStatus(''); }
    })();
    return ()=>{ alive = false; };
  }, [date]);
  return (
    <div className="card" style={{maxWidth:720, margin:'16px auto 0'}}>
      <div className="row" style={{alignItems:'center', gap:12}}>
        <h3 style={{marginTop:0, marginBottom:0}}>My Attendance</h3>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} style={{marginLeft:'auto'}} />
      </div>
      <div style={{marginTop:8}}>
        <div className="muted">Date: {new Date(date).toLocaleDateString()}</div>
        <div style={{marginTop:6}}>
          Status: <span className="tag">{status ? status.toUpperCase() : '—'}</span>
        </div>
      </div>
      
      <style jsx>{`
        .learning-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
        .badge-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
        .certificate-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.12);
        }
      `}</style>
    </div>
  );
}
