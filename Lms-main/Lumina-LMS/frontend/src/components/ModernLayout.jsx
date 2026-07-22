import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationsAPI, CoursesAPI } from '../api/client';

export default function ModernLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const sidebarOpen = true; // Sidebar is fixed open
  const setSidebarOpen = () => {};
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return false;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  const settingsRef = useRef(null);
  const nav = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState([]);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [notifStatusFilter, setNotifStatusFilter] = useState('unread'); // 'unread', 'read', 'all'
  const [notifTimeFilter, setNotifTimeFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [notifTypeFilter, setNotifTypeFilter] = useState(''); // '', 'info', 'success', 'warning', 'error'
  const [notifSearch, setNotifSearch] = useState('');
  const [notifPage, setNotifPage] = useState(1);
  const [notifTotal, setNotifTotal] = useState(0);
  const [notifLimit] = useState(5);
  const [toasts, setToasts] = useState([]); // Array of { id, title, message, type }
  const notifRef = useRef(null);

  // Play sound & push toast
  const triggerToast = (title, message, type = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, title, message, type }]);

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (_) {}

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { data } = await NotificationsAPI.list({ status: 'unread', limit: 100 });
      const currentUnread = data.total || 0;
      
      if (currentUnread > notifUnreadCount) {
        // Find newly received elements
        const newItems = (data.notifications || []).filter(
          n => !notifList.some(item => item._id === n._id)
        );
        newItems.forEach(n => {
          triggerToast(n.title, n.message || n.body, n.type);
        });
      }
      setNotifUnreadCount(currentUnread);
    } catch (e) {
      console.error('Fetch unread error:', e);
    }
  };

  const fetchNotificationList = async (page = 1) => {
    if (!user) return;
    try {
      const params = {
        status: notifStatusFilter,
        time: notifTimeFilter,
        type: notifTypeFilter || undefined,
        search: notifSearch || undefined,
        page,
        limit: notifLimit
      };
      const { data } = await NotificationsAPI.list(params);
      let list = data.notifications || [];

      // Check student pending study time
      if (page === 1 && String(user.role).toLowerCase() === 'student' && notifStatusFilter !== 'read') {
        try {
          const todayStr = new Date().toISOString().split('T')[0];
          const stored = localStorage.getItem(`lumina_time_spent_v2_${user.email}`);
          const timeData = stored ? JSON.parse(stored) : {};
          const secondsToday = timeData[todayStr] || 0;

          if (secondsToday < 60) {
            const { data: enrollData } = await CoursesAPI.myEnrollments();
            const activeEnrolls = (enrollData.enrollments || []).filter(e => e.status !== 'completed');
            activeEnrolls.forEach(e => {
              list.unshift({
                _id: `pending-${e.course?._id || 'course'}`,
                title: 'Course Progress Pending',
                message: `Your course "${e.course?.title || 'course'}" is pending study hours today!`,
                isRead: false,
                read: false,
                createdAt: new Date().toISOString(),
                actionUrl: `/courses/${e.course?._id}`,
                link: `/courses/${e.course?._id}`,
                type: 'warning'
              });
            });
          }
        } catch (_) {}
      }

      if (page === 1) {
        setNotifList(list);
      } else {
        setNotifList(prev => [...prev, ...list]);
      }
      setNotifTotal(data.total || 0);
      setNotifPage(page);
    } catch (err) {
      console.error(err);
    }
  };

  // Real-time updates effect
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [user, notifUnreadCount]);

  // Filters refresh effect
  useEffect(() => {
    if (notifOpen) {
      fetchNotificationList(1);
    }
  }, [notifStatusFilter, notifTimeFilter, notifTypeFilter, notifSearch, notifOpen]);

  const toggleNotif = () => {
    setNotifOpen(v => !v);
  };

  const markAsRead = async (id) => {
    if (id.startsWith('pending-')) {
      setNotifList(prev => prev.map(n => n._id === id ? { ...n, isRead: true, read: true } : n));
      return;
    }
    try {
      await NotificationsAPI.markRead(id);
      setNotifList(prev => prev.map(n => n._id === id ? { ...n, isRead: true, read: true } : n));
      setNotifUnreadCount(prev => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const markAllRead = async () => {
    try {
      await NotificationsAPI.markAllRead();
      setNotifList(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      setNotifUnreadCount(0);
      triggerToast('Success', 'All notifications marked as read', 'success');
    } catch (_) {}
  };

  const deleteNotification = async (id) => {
    if (window.confirm('Delete this notification?')) {
      if (id.startsWith('pending-')) {
        setNotifList(prev => prev.filter(n => n._id !== id));
        return;
      }
      try {
        await NotificationsAPI.delete(id);
        setNotifList(prev => prev.filter(n => n._id !== id));
        fetchUnreadCount();
      } catch (_) {}
    }
  };
  
  const toggleTheme = () => {
    const newTheme = !isDark;
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    setIsDark(newTheme);
  };
  

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active time tracking in local storage
  useEffect(() => {
    if (!user) return;
    
    const getLocalDateString = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    
    const dateStr = getLocalDateString(new Date());
    let lastActive = Date.now();
    
    const getStoredTime = () => {
      try {
        const stored = localStorage.getItem(`lumina_time_spent_v2_${user?.email || 'guest'}`);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    };
    
    const saveStoredTime = (data) => {
      try {
        localStorage.setItem(`lumina_time_spent_v2_${user?.email || 'guest'}`, JSON.stringify(data));
      } catch (err) {
        console.error(err);
      }
    };

    const stored = getStoredTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActive;
      
      if (idleTime < 15000) { // Count active time (up to 15s since last action)
        const updated = getStoredTime();
        const currentSeconds = updated[dateStr] || 0;
        updated[dateStr] = currentSeconds + 2; // interval is 2s
        saveStoredTime(updated);
      }
    }, 2000);

    const handleActivity = () => {
      lastActive = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user]);

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/courses', icon: '📖', label: 'Courses' },
    { path: '/assignments', icon: '📝', label: 'Assignments' },
    { path: '/grades', icon: '🎓', label: 'Grades' }
  ];
  if (user && (String(user.role).toLowerCase() === 'teacher' || String(user.role).toLowerCase() === 'admin')) {
    menuItems.push({ path: '/activity', icon: '⏱️', label: 'Activity' });
  }


  const isActive = (path) => location.pathname === path;

  // Derive user initials
  const initials = (user?.name || 'U').trim().split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '260px' : '76px',
        backgroundColor: '#0F204C',
        borderRight: 'none',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40
      }}>
        {/* Logo Section */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
          height: '80px',
          boxSizing: 'border-box'
        }}>
          {sidebarOpen ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'white',
              padding: '6px 12px',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#C21C24',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '900',
                fontSize: '10px'
              }}>
                LM
              </div>
              <span style={{
                color: '#C21C24',
                fontWeight: '900',
                fontSize: '1rem',
                letterSpacing: '-0.02em'
              }}>
                LUMINA
              </span>
            </div>
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              background: 'white',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: '#C21C24',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '900',
                fontSize: '10px'
              }}>
                LM
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '20px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  borderRadius: '8px',
                  backgroundColor: active ? '#2563EB' : 'transparent',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  letterSpacing: '0.02em',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  marginBottom: '4px'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                  }
                }}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span style={{ 
                  fontSize: '1.2rem', 
                  marginRight: sidebarOpen ? '16px' : '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'inherit'
                }}>
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <span style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: 'inherit'
                  }}>
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Toggle Button */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              border: '1px solid transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              transition: 'all 0.2s ease',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', color: 'inherit' }}>
              {sidebarOpen ? '◀' : '☰'}
            </span>
            {sidebarOpen && (
              <span style={{ marginLeft: '12px', fontSize: '0.9rem', color: 'inherit' }}>
                Collapse Sidebar
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        
        {/* Animated Premium Background Layer */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '10%', left: '20%', width: '40vw', height: '40vw',
            background: 'radial-gradient(circle, rgba(79, 140, 255, 0.08) 0%, transparent 70%)',
            filter: 'blur(60px)', animation: 'floatElement 20s infinite ease-in-out'
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vw',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
            filter: 'blur(60px)', animation: 'floatElement 15s infinite ease-in-out reverse'
          }} />
        </div>
        {/* Top Header */}
        <header style={{
          backgroundColor: 'var(--nav-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 32px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          
          {/* Header Search Bar */}
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
              🔍
            </span>
            <input 
              type="text" 
              placeholder="Search courses, assignments..." 
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '9999px',
                color: 'var(--text)',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(79, 140, 255, 0.15)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                title="Notifications" 
                onClick={toggleNotif}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text)',
                  position: 'relative'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {notifUnreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'var(--color-error)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    border: '2px solid var(--color-panel)'
                  }}>
                    {notifUnreadCount}
                  </span>
                )}
              </button>
              
              {notifOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '380px',
                  maxHeight: '520px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--color-panel)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  border: '1px solid var(--border)',
                  zIndex: 9999,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* Dropdown Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: 'var(--text)' }}>
                      <span>🔔 Notifications</span>
                      {notifUnreadCount > 0 && (
                        <span style={{
                          backgroundColor: 'rgba(59,130,246,0.1)',
                          color: 'var(--color-accent)',
                          fontSize: '0.78rem',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontWeight: '800'
                        }}>{notifUnreadCount} unread</span>
                      )}
                    </div>
                    {notifUnreadCount > 0 && (
                      <button 
                        onClick={markAllRead}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-accent)', fontSize: '0.8rem', fontWeight: '800' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Search Bar */}
                  <input 
                    type="text" 
                    value={notifSearch}
                    onChange={(e) => setNotifSearch(e.target.value)}
                    placeholder="🔍 Search notifications..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.8rem'
                    }}
                  />

                  {/* Filters Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 'bold', marginBottom: '4px' }}>Time range</label>
                      <select 
                        value={notifTimeFilter}
                        onChange={(e) => setNotifTimeFilter(e.target.value)}
                        style={{ width: '100%', padding: '6px', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                      >
                        <option value="all">All time</option>
                        <option value="today">Today</option>
                        <option value="week">This week</option>
                        <option value="month">This month</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 'bold', marginBottom: '4px' }}>Alert type</label>
                      <select 
                        value={notifTypeFilter}
                        onChange={(e) => setNotifTypeFilter(e.target.value)}
                        style={{ width: '100%', padding: '6px', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                      >
                        <option value="">All levels</option>
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                      </select>
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    {['unread', 'read', 'all'].map(status => (
                      <button
                        key={status}
                        onClick={() => setNotifStatusFilter(status)}
                        style={{
                          border: 'none',
                          background: notifStatusFilter === status ? 'var(--color-accent)' : 'transparent',
                          color: notifStatusFilter === status ? 'white' : 'var(--text)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {status.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Notifications List */}
                  {notifList.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                      No notifications matching filters.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {notifList.map(n => {
                        let indicatorColor = '#3b82f6';
                        if (n.type === 'success') indicatorColor = '#10b981';
                        else if (n.type === 'warning') indicatorColor = '#f59e0b';
                        else if (n.type === 'error') indicatorColor = '#ef4444';

                        const isRead = n.isRead || n.read;

                        return (
                          <div 
                            key={n._id}
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              background: isRead ? 'transparent' : 'rgba(139,92,246,0.04)',
                              border: '1px solid var(--border)',
                              borderLeft: `4px solid ${indicatorColor}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '12px',
                              cursor: (n.actionUrl || n.link) ? 'pointer' : 'default',
                              transition: 'all 0.2s',
                              textAlign: 'left'
                            }}
                            onClick={() => {
                              if (!isRead) markAsRead(n._id);
                              const targetUrl = n.actionUrl || n.link;
                              if (targetUrl) {
                                nav(targetUrl);
                                setNotifOpen(false);
                              }
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '800', fontSize: '0.82rem', color: 'var(--text)', marginBottom: '2px' }}>
                                {n.title}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: '1.4', marginBottom: '4px' }}>
                                {n.message || n.body}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', display: 'flex', gap: '8px' }}>
                                <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>•</span>
                                <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                              {!isRead && (
                                <button 
                                  title="Mark as read"
                                  onClick={() => markAsRead(n._id)}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#10B981', fontSize: '0.8rem', padding: '2px' }}
                                >
                                  ✓
                                </button>
                              )}
                              <button 
                                title="Delete log"
                                onClick={() => deleteNotification(n._id)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', fontSize: '0.9rem', padding: '2px' }}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Load More Pagination */}
                  {notifList.length < notifTotal && (
                    <button 
                      onClick={() => fetchNotificationList(notifPage + 1)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => e.target.style.backgroundColor = 'var(--border)'}
                      onMouseLeave={e => e.target.style.backgroundColor = 'var(--bg)'}
                    >
                      🔄 Load More Notifications ({notifList.length} of {notifTotal})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Custom Toast Alert Styling Injection */}
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}</style>

            {/* Toast Notification Container Stack */}
            <div style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxWidth: '350px',
              width: '100%'
            }}>
              {toasts.map(toast => {
                let typeColor = '#3b82f6'; // info
                let typeIcon = 'ℹ️';
                if (toast.type === 'success') {
                  typeColor = '#10b981';
                  typeIcon = '✅';
                } else if (toast.type === 'warning') {
                  typeColor = '#f59e0b';
                  typeIcon = '⚠️';
                } else if (toast.type === 'error') {
                  typeColor = '#ef4444';
                  typeIcon = '❌';
                }

                return (
                  <div 
                    key={toast.id}
                    style={{
                      background: 'var(--color-panel)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      border: '1px solid var(--border)',
                      borderLeft: `5px solid ${typeColor}`,
                      animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}
                  >
                    <div style={{ fontSize: '1.25rem' }}>{typeIcon}</div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text)' }}>{toast.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '4px', lineHeight: '1.4' }}>{toast.message}</div>
                    </div>
                    <button 
                      onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.1rem', fontWeight: 'bold', padding: '0 4px' }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Shopping Cart Icon */}
            <button 
              onClick={() => alert('not available')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4B5563'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)',
                fontSize: '1.2rem',
                borderRadius: '50%',
                transition: 'background 0.2s',
                marginRight: '8px'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* User Profile Pill with Settings Dropdown */}
            <div style={{ position: 'relative' }} ref={settingsRef}>
              <button 
                onClick={() => setSettingsOpen(!settingsOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  textDecoration: 'none'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6B7280'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text)', textTransform: 'uppercase' }}>
                  {user?.name || 'Student'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text)' }}>▼</span>
              </button>

              {settingsOpen && (
                <div className="fade-in-up" style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '220px',
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <Link to="/profile" style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                    color: 'var(--text)', textDecoration: 'none', borderRadius: '8px',
                    transition: 'background 0.2s', fontSize: '0.9rem', fontWeight: '500'
                  }} onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg)'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                  onClick={() => setSettingsOpen(false)}>
                    <span style={{ fontSize: '1.2rem' }}>👤</span> Edit Profile
                  </Link>

                  <Link to="/settings" style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                    color: 'var(--text)', textDecoration: 'none', borderRadius: '8px',
                    transition: 'background 0.2s', fontSize: '0.9rem', fontWeight: '500'
                  }} onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg)'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                  onClick={() => setSettingsOpen(false)}>
                    <span style={{ fontSize: '1.2rem' }}>🔑</span> Password
                  </Link>

                  <Link to="/faq" style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                    color: 'var(--text)', textDecoration: 'none', borderRadius: '8px',
                    transition: 'background 0.2s', fontSize: '0.9rem', fontWeight: '500'
                  }} onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg)'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                  onClick={() => setSettingsOpen(false)}>
                    <span style={{ fontSize: '1.2rem' }}>❓</span> Help Center
                  </Link>

                  <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

                  <button style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
                    color: 'var(--danger)', background: 'transparent', border: 'none', borderRadius: '8px',
                    transition: 'background 0.2s', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                    textAlign: 'left'
                  }} onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg)'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                  onClick={() => {
                    setSettingsOpen(false);
                    logout();
                    window.location.href = '/login';
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="fade-in-up" style={{
          flex: 1,
          padding: '32px',
          overflow: 'auto',
          backgroundColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
