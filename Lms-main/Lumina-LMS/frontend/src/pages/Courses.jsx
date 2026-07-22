import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CoursesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(4);

  const getCourseImage = (title) => {
    const lower = (title || '').toLowerCase();
    if (lower.includes('database') || lower.includes('sql') || lower.includes('relational')) {
      return '/course_database.png';
    }
    if (lower.includes('diagram') || lower.includes('lucidchart') || lower.includes('structures') || lower.includes('algorithm')) {
      return '/course_lucidchart.png';
    }
    if (lower.includes('mainframe') || lower.includes('ibm') || lower.includes('cobol')) {
      return '/course_mainframe.png';
    }
    if (lower.includes('linux') || lower.includes('file management') || lower.includes('devops')) {
      return '/course_linux.png';
    }
    if (lower.includes('javascript') || lower.includes('react') || lower.includes('node') || lower.includes('frontend') || lower.includes('web')) {
      return '/course_webdev.png';
    }
    if (lower.includes('python') || lower.includes('ai') || lower.includes('intelligence') || lower.includes('machine learning') || lower.includes('data science')) {
      return '/course_ai.png';
    }
    return '/course_general.png';
  };

  const getCourseProvider = (title) => {
    const lower = (title || '').toLowerCase();
    if (lower.includes('ibm') || lower.includes('mainframe')) {
      return { name: 'IBM' };
    }
    return { name: 'Coursera' };
  };

  const getCourseType = (title) => {
    const lower = (title || '').toLowerCase();
    if (lower.includes('mainframe developer')) {
      return 'Professional Certificate';
    }
    return 'Guided Project';
  };

  useEffect(() => {
    const load = async () => {
      try {
        // First load courses without authentication
        const { data: coursesData } = await CoursesAPI.list();
        const allCourses = coursesData.courses || [];
        
        // Then try to load enrollments (may fail if not authenticated)
        let enrollments = [];
        try {
          const { data: enrollmentsData } = await CoursesAPI.myEnrollments();
          enrollments = enrollmentsData.enrollments || [];
        } catch (enrollmentError) {
          console.log('Enrollment data not available:', enrollmentError?.response?.status);
          // Continue without enrollment data
        }
        
        // Filter out completed courses for students
        const userRole = (user?.role || '').toLowerCase();
        if (userRole === 'student') {
          const completedCourseIds = enrollments
            .filter(e => e.status === 'completed')
            .map(e => e.course?._id)
            .filter(Boolean);
          
          const availableCourses = allCourses.filter(course => 
            !completedCourseIds.includes(course._id)
          );
          
          setCourses(availableCourses);
          setEnrolledCourses(enrollments);
        } else {
          setCourses(allCourses);
          setEnrolledCourses(enrollments);
        }
      } catch (e) {
        console.error('Courses loading error:', e);
        setError(e?.response?.data?.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div style={{ marginTop: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '0.05em' }}>
              COURSES
            </h1>
          </div>
          {(user?.role || '').toLowerCase() === 'teacher' && (
            <Link to="/courses/new" className="btn primary" style={{ borderRadius: '6px' }}>Create Course</Link>
          )}
        </div>
      </div>

      {error && <div className="alert danger">{error}</div>}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading courses...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Left / Top Section: Enrollments */}
          {(user?.role || '').toLowerCase() === 'student' && enrolledCourses.length > 0 && (
            <div className="card fade-in-up" style={{ marginBottom: 0, background: 'var(--panel)', border: '1px solid var(--border)', padding: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                📚 Your Enrollments
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {enrolledCourses.map(enrollment => (
                  <div key={enrollment._id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px', color: 'var(--text)' }}>
                        {enrollment.course?.title || 'Unknown Course'}
                      </div>
                      <div className="muted small" style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        Status: {enrollment.status || 'enrolled'}
                      </div>
                    </div>
                    {enrollment.status === 'completed' ? (
                      <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 700 }}>✅ Completed</span>
                    ) : (
                      <Link to={`/courses/${enrollment.course?._id}`} className="btn outline" style={{ padding: '8px 16px', fontSize: '0.9rem', width: 'max-content', borderRadius: '6px' }}>
                        Continue Learning
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Main Catalog: Available Courses */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text)', fontSize: '1.2rem', fontWeight: '800' }}>
              ✨ Available Courses
            </h4>
            
            <div className="courses-grid fade-in-up stagger-1">
              {courses.slice(0, visibleCount).map(c => {
                const isEnrolled = enrolledCourses.some(e => e.course?._id === c._id && e.status !== 'completed');
                const provider = getCourseProvider(c.title);
                return (
                  <div 
                    key={c._id} 
                    className="card hover-lift" 
                    style={{
                      opacity: isEnrolled ? 0.8 : 1,
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--panel)',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'
                    }}
                  >
                    <img 
                      src={getCourseImage(c.title)} 
                      alt={c.title} 
                      style={{ 
                        width: '100%', 
                        height: '140px', 
                        objectFit: 'cover' 
                      }} 
                    />
                    
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: 'var(--muted)',
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--border)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {provider.name}
                        </span>
                      </div>
                      
                      <h3 style={{
                        margin: '0 0 6px 0',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: 'var(--text)',
                        minHeight: '38px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.4'
                      }}>
                        {c.title}
                      </h3>
                      

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', flex: 1, alignItems: 'flex-end' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          color: 'var(--muted)',
                          border: '1px solid var(--border)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontWeight: '600',
                          backgroundColor: 'var(--panel)'
                        }}>
                          Credit offered
                        </span>
                      </div>
                      
                      <div style={{ marginTop: 'auto' }}>
                        {isEnrolled ? (
                          <Link 
                            to={`/courses/${c._id}`} 
                            className="btn secondary ripple-btn" 
                            style={{ 
                              width: '100%', 
                              textAlign: 'center', 
                              padding: '8px', 
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '700'
                            }}
                          >
                            Resume Course 🚀
                          </Link>
                        ) : (
                          <Link 
                            to={`/courses/${c._id}`} 
                            className="btn primary ripple-btn" 
                            style={{ 
                              width: '100%', 
                              textAlign: 'center', 
                              padding: '8px', 
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '700'
                            }}
                          >
                            View Details
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {courses.length > visibleCount && (
              <div style={{ marginTop: '24px', textAlign: 'left' }}>
                <button 
                  onClick={() => setVisibleCount(courses.length)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--panel)',
                    color: 'var(--primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.04)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--panel)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  Show {courses.length - visibleCount} more
                </button>
              </div>
            )}

            {courses.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                <div className="muted" style={{ fontSize: 16 }}>
                  {(user?.role || '').toLowerCase() === 'student' 
                    ? 'No available courses. Complete enrolled courses to see more options.'
                    : 'No courses available.'
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
