import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { CoursesAPI, CertificatesAPI, AssignmentsAPI, NotificationsAPI } from '../api/client';

export default function ModernDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeData, setTimeData] = useState({});
  const [browseHover, setBrowseHover] = useState(false);
  const [lastViewed, setLastViewed] = useState('');

  useEffect(() => {
    const prevView = localStorage.getItem('lumina_last_viewed_student');
    const now = new Date();
    const formatDateTime = (date) => {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      let hrs = date.getHours();
      const mins = String(date.getMinutes()).padStart(2, '0');
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12;
      hrs = hrs ? hrs : 12;
      const hrsStr = String(hrs).padStart(2, '0');
      return `${d}/${m}/${y} | ${hrsStr}:${mins} ${ampm}`;
    };
    if (prevView) {
      setLastViewed(prevView);
    } else {
      setLastViewed(formatDateTime(now));
    }
    localStorage.setItem('lumina_last_viewed_student', formatDateTime(now));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eRes, cRes, sRes, nRes] = await Promise.all([
          CoursesAPI.myEnrollments().catch(() => ({ data: { enrollments: [] } })),
          CertificatesAPI.list().catch(() => ({ data: { certificates: [] } })),
          AssignmentsAPI.mySubmissions().catch(() => ({ data: { submissions: [] } })),
          NotificationsAPI.list({ limit: 5, status: 'unread' }).catch(() => ({ data: { notifications: [] } }))
        ]);
        setEnrollments(eRes.data?.enrollments || []);
        setCertificates(cRes.data?.certificates || []);
        setSubmissions(sRes.data?.submissions || []);
        setNotifs(nRes.data?.notifications || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    const getStoredTime = () => {
      try {
        const stored = localStorage.getItem(`lumina_time_spent_v2_${user?.email || 'guest'}`);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    };
    setTimeData(getStoredTime());
  }, [user]);

  // Active time calculations
  const totalSeconds = useMemo(() => Object.values(timeData).reduce((a, b) => a + b, 0), [timeData]);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const activeDays = useMemo(() => Object.keys(timeData).filter(day => timeData[day] > 0).length, [timeData]);
  
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }, []);
  const todaySeconds = timeData[todayStr] || 0;
  const todayHours = (todaySeconds / 3600).toFixed(1);

  // Dynamic streak calculator
  const streakDays = useMemo(() => {
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      if (timeData[key] && timeData[key] > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [timeData]);

  // 7 Days Chart Data Prep
  const last7Days = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      const name = dt.toLocaleDateString([], { weekday: 'short' });
      const sec = timeData[key] || 0;
      result.push({ name, hours: parseFloat((sec / 3600).toFixed(1)) });
    }
    return result;
  }, [timeData]);

  const maxChartHours = useMemo(() => {
    const max = Math.max(...last7Days.map(d => d.hours));
    return max > 0 ? Math.ceil(max) : 3;
  }, [last7Days]);

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
        <span style={{ color: 'var(--muted)', fontWeight: 'bold' }}>Loading Premium Student Workspace...</span>
      </div>
    );
  }

  // Continue Learning Course Selection
  const activeCourse = enrollments.find(e => e.status !== 'completed') || enrollments[0];

  return (
    <div style={{ display: 'grid', gap: '24px', maxWidth: '1800px', width: '90%', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Upper Title Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '0.05em' }}>STUDENT WORKSPACE</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>Welcome back, keep tracking your active learning habits!</p>
        </div>
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--text)',
          background: 'var(--panel)',
          padding: '10px 18px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          fontWeight: '700'
        }}>
          ⏱️ Last Sync: {lastViewed}
        </div>
      </div>

      {/* Enhanced profile cover banner with gradient */}
      <div style={{
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
        position: 'relative'
      }}>
        {/* Cover image wrapper */}
        <div style={{
          height: '170px',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '32px'
        }}>
          {/* Subtle grid patterns overlay */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: 0.15,
            backgroundSize: '20px 20px',
            backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)'
          }} />
          <div style={{ zIndex: 10, color: 'rgba(255,255,255,0.95)', textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.1em' }}>Learning streak</span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '2.2rem', fontWeight: '900', color: '#FFF' }}>🔥 {streakDays} Days</h2>
          </div>
        </div>

        {/* User profile row */}
        <div style={{
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* 80px Profile Avatar */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '4px solid var(--panel)',
              backgroundColor: 'var(--bg)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
              marginTop: '-55px',
              zIndex: 10,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {user?.profileImage ? (
                <img src={user.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2rem' }}>👤</span>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: 'var(--text)' }}>{user?.name || "Student"}</h2>
                <span style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Student</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--muted)', fontWeight: '600' }}>
                {user?.email} | Register ID: <strong>{user?.rollNo || 'N/A'}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/courses" className="btn primary ripple-btn" style={{ borderRadius: '8px', padding: '12px 24px', fontSize: '0.9rem', fontWeight: '700' }}>
              Resume Learning 🚀
            </Link>
            <Link to="/profile" className="btn secondary" style={{ borderRadius: '8px', padding: '12px 24px', fontSize: '0.9rem', fontWeight: '700', border: '1px solid var(--border)' }}>
              Edit Profile ⚙️
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: 4-Column Stats & Daily Goal progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
        {[
          { title: 'Total Study Time', val: `${totalHours} hrs`, desc: `${activeDays} active days logged`, icon: '⏱️', class: 'dashboard-card-grad-blue' },
          { title: 'Courses Joined', val: enrollments.length, desc: `${enrollments.filter(e => e.status === 'completed').length} completed`, icon: '📚', class: 'dashboard-card-grad-green' },
          { title: 'Quiz Score Avg', val: '86%', desc: 'Based on recent quizzes', icon: '📝', class: 'dashboard-card-grad-purple' },
          { title: 'Certificates Won', val: certificates.length, desc: 'Verified accomplishments', icon: '🎓', class: 'dashboard-card-grad-orange' }
        ].map((card, idx) => (
          <div key={idx} className={`card hover-lift ${card.class}`} style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: '800', color: 'var(--text)', letterSpacing: '0.05em' }}>{card.title}</span>
              <h3 style={{ margin: '8px 0 4px 0', fontSize: '1.8rem', fontWeight: '900', color: 'var(--text)' }}>{card.val}</h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--muted)', fontWeight: '600' }}>{card.desc}</span>
            </div>
            <div style={{ fontSize: '2.5rem', opacity: 0.9 }}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Grid: Daily Goal & Continue Learning */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Daily Goal card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: 'var(--text)' }}>🎯 Daily Study Goal</h3>
            <p style={{ margin: '4px 0 16px 0', color: 'var(--muted)', fontSize: '0.8rem' }}>Target: 3.0 learning hours per day</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* SVG Progress Circle */}
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
              <svg width="100" height="100" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="3.5"
                  strokeDasharray={`${Math.min(100, Math.round((todayHours / 3) * 100))}, 100`}
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: '900', fontSize: '1.1rem', color: 'var(--text)' }}>
                {Math.min(100, Math.round((todayHours / 3) * 100))}%
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: 'var(--text)' }}>{todayHours} Hours</h4>
              <p style={{ margin: '2px 0 0 0', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: '600' }}>Completed today</p>
              <p style={{ margin: '8px 0 0 0', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: '800' }}>
                {todayHours >= 3 ? '🎉 Goal Achieved!' : `⏳ ${parseFloat((3 - todayHours).toFixed(1))}h remaining`}
              </p>
            </div>
          </div>
        </div>

        {/* Continue Learning card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: 'var(--text)' }}>📖 Continue Learning</h3>
            <p style={{ margin: '4px 0 16px 0', color: 'var(--muted)', fontSize: '0.8rem' }}>Pick up right where you left off</p>
          </div>
          
          {activeCourse ? (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59,130,246,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                border: '1px solid var(--border)'
              }}>
                📘
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text)' }}>{activeCourse.course?.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  {/* Progress bar */}
                  <div style={{ flex: 1, height: '6px', borderRadius: '4px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: activeCourse.status === 'completed' ? '100%' : '45%', backgroundColor: 'var(--color-accent)' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text)' }}>
                    {activeCourse.status === 'completed' ? '100%' : '45%'}
                  </span>
                </div>
                <button 
                  onClick={() => nav(`/courses/${activeCourse.course?._id || activeCourse.course}`)}
                  className="btn primary" 
                  style={{ marginTop: '12px', padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px' }}
                >
                  Resume class ➔
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No enrolled classes currently in progress.</p>
          )}
        </div>
      </div>

      {/* Grid: Weekly progress Chart & Deadlines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* SVG Weekly progress Chart */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: 'var(--text)' }}>📈 Weekly Study Hours</h3>
            <p style={{ margin: '4px 0 20px 0', color: 'var(--muted)', fontSize: '0.8rem' }}>Time spent studying over the last 7 days</p>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ width: '100%', height: '160px', position: 'relative' }}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 400 160">
              {/* Grid lines */}
              <line x1="40" y1="20" x2="380" y2="20" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="40" y1="70" x2="380" y2="70" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
              <line x1="40" y1="120" x2="380" y2="120" stroke="var(--border)" strokeWidth="0.5" />
              
              {/* Bars */}
              {last7Days.map((day, idx) => {
                const barWidth = 26;
                const gap = 20;
                const startX = 55 + idx * (barWidth + gap);
                const barHeight = maxChartHours > 0 ? (day.hours / maxChartHours) * 90 : 0;
                const startY = 120 - barHeight;

                return (
                  <g key={idx}>
                    <rect 
                      x={startX} 
                      y={startY} 
                      width={barWidth} 
                      height={barHeight} 
                      fill="var(--color-accent)" 
                      rx="4"
                      style={{ transition: 'all 0.3s' }}
                    />
                    <text 
                      x={startX + barWidth / 2} 
                      y={startY - 6} 
                      fill="var(--text)" 
                      fontSize="9px" 
                      fontWeight="bold" 
                      textAnchor="middle"
                    >
                      {day.hours > 0 ? `${day.hours}h` : ''}
                    </text>
                    <text 
                      x={startX + barWidth / 2} 
                      y="138" 
                      fill="var(--muted)" 
                      fontSize="9px" 
                      fontWeight="800" 
                      textAnchor="middle"
                    >
                      {day.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: 'var(--text)' }}>🚨 Upcoming Deadlines</h3>
            <p style={{ margin: '4px 0 16px 0', color: 'var(--muted)', fontSize: '0.8rem' }}>Submit assignments before time runs out</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto' }}>
            {[
              { title: 'Project Proposal Draft', course: 'Lumina LMS Architecture', days: '2 days remaining', priority: 'High', color: 'var(--color-error)' },
              { title: 'React Lifecycle Homework', course: 'Advanced Frontend Web App', days: '5 days remaining', priority: 'Medium', color: 'var(--color-warning)' }
            ].map((dl, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                borderRadius: '8px'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: '800', color: 'var(--text)' }}>{dl.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{dl.course}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: 'white',
                    backgroundColor: dl.color,
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>{dl.priority}</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '4px', fontWeight: '600' }}>{dl.days}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid: Achievements & Learning Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Achievements Section */}
        <div className="card" style={{ padding: '24px', textAlign: 'left' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: 'var(--text)' }}>🏆 Achievements & Milestones</h3>
          <p style={{ margin: '4px 0 20px 0', color: 'var(--muted)', fontSize: '0.8rem' }}>Unlocks as you progress through materials</p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { icon: '🚀', title: 'First Steps', desc: 'Enrolled in 1st course', active: true },
              { icon: '🔥', title: 'Habit Builder', desc: '5 Days active learning streak', active: streakDays >= 5 },
              { icon: '🎓', title: 'Alumni', desc: 'Earned a completion certificate', active: certificates.length > 0 }
            ].map((badge, idx) => (
              <div key={idx} style={{
                flex: '1 1 100px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                textAlign: 'center',
                background: badge.active ? 'var(--bg)' : 'transparent',
                opacity: badge.active ? 1 : 0.4
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{badge.icon}</div>
                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: '800', color: 'var(--text)' }}>{badge.title}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: 'var(--muted)', lineHeight: '1.3' }}>{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Activity Timeline */}
        <div className="card" style={{ padding: '24px', textAlign: 'left' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: 'var(--text)' }}>⚡ Learning Activity Timeline</h3>
          <p style={{ margin: '4px 0 16px 0', color: 'var(--muted)', fontSize: '0.8rem' }}>Audit trail of your study actions</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '160px', overflowY: 'auto' }}>
            {[
              { time: '09:30 AM', action: 'Simulated Lesson study click', status: 'Completed' },
              { time: 'Yesterday', action: 'Accessed Course detail page', status: 'Viewed' }
            ].map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px dashed var(--border)',
                fontSize: '0.82rem'
              }}>
                <div>
                  <span style={{ fontWeight: '800', color: 'var(--text)' }}>{item.action}</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>Time: {item.time}</div>
                </div>
                <span style={{
                  color: 'var(--color-success)',
                  fontWeight: '800',
                  fontSize: '0.76rem'
                }}>✓ {item.status}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
