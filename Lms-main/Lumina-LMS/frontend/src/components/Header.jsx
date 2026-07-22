import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationsAPI } from '../api/client';
import './navbar.css';

export default function Header() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const avatarUrl = typeof window !== 'undefined' ? (localStorage.getItem('avatarUrl') || '') : '';
  const initials = (user?.name || 'U').trim().split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();

  const doLogout = () => { logout(); nav('/', { replace: true }); };
  const notify = () => { alert('No new notifications'); };

  // PWA Install Prompt State & Effect Hook
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const [open, setOpen] = useState(false); // profile menu
  const menuRef = useRef(null);
  const [navOpen, setNavOpen] = useState(false); // hamburger menu
  const navRef = useRef(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.read).length;
  useEffect(() => {
    const onDocClick = (e) => {
      const inProfile = menuRef.current && menuRef.current.contains(e.target);
      const inNav = navRef.current && navRef.current.contains(e.target);
      const inNotif = notifRef.current && notifRef.current.contains(e.target);
      if (inProfile || inNav || inNotif) return;
      setOpen(false);
      setNavOpen(false);
      setNotifOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const toggleNotif = async () => {
    setNotifOpen(v => !v);
    try {
      if (!notifOpen) {
        const { data } = await NotificationsAPI.list();
        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      }
    } catch (error) {
      setNotifications([]);
    }
  };

  const markAsRead = async (id) => {
    try {
      await NotificationsAPI.markRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (_) {}
  };

  const deleteNotification = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await NotificationsAPI.delete(id);
        setNotifications(prev => prev.filter(n => n._id !== id));
      } catch (_) {}
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Navigate if there's a link
    if (notification.link) {
      nav(notification.link);
      setNotifOpen(false); // Close dropdown after navigation
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        {user && (
          <div ref={navRef} className="hamburger-menu">
            <button className="hamburger" title="Menu" onClick={()=>setNavOpen(v=>!v)} aria-haspopup="menu" aria-expanded={navOpen}>
              <span></span>
              <span></span>
              <span></span>
            </button>
            {navOpen && (
              <div role="menu" className="hamburger-dropdown">
                <Link to="/courses" onClick={()=>setNavOpen(false)}>Courses</Link>
                <Link to="/assignments" onClick={()=>setNavOpen(false)}>Assignments</Link>
                <Link to="/attendance" onClick={()=>setNavOpen(false)}>Attendance</Link>
                <Link to="/timetable" onClick={()=>setNavOpen(false)}>Timetable</Link>
                <Link to="/assignments" onClick={()=>setNavOpen(false)}>Assessments</Link>
                <Link to="/grades" onClick={()=>setNavOpen(false)}>Grades</Link>
                {role === 'teacher' && (
                  <Link to="/leave-approvals" onClick={()=>setNavOpen(false)}>Permissions</Link>
                )}
                {role === 'teacher' && (
                  <Link to="/fee-management" onClick={()=>setNavOpen(false)}>Fee Management</Link>
                )}
                {role === 'student' && (
                  <>
                    <Link to="/leave" onClick={()=>setNavOpen(false)}>Leave</Link>
                    <Link to="/feedback" onClick={()=>setNavOpen(false)}>Feedback</Link>
                    <Link to="/billing" onClick={()=>setNavOpen(false)}>Billing</Link>
                    <Link to="/messages" onClick={()=>setNavOpen(false)}>Messages</Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <Link to="/" className="brand">Lumina LMS</Link>
        <nav className="menu">
          {user && role === 'teacher' && <Link to="/admin">Admin</Link>}
        </nav>
      </div>
      <div className="nav-right">
        {!user ? (
          <div className="menu">
            <Link to="/login" className="btn small">Login</Link>
            <Link to="/register" className="btn small">Register</Link>
          </div>
        ) : (
          <div className="right-actions">
            {showInstallBtn && (
              <button 
                onClick={handleInstallClick} 
                className="btn primary" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  marginRight: '12px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                  boxShadow: '0 0 10px rgba(79, 70, 229, 0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                📥 Install App
              </button>
            )}
            <Link to="/" title="Home" className="right-link">Home</Link>
            <div ref={notifRef} className="notif-menu">
            <button title="Notifications" onClick={toggleNotif} aria-label="Notifications" className="bell">
              <svg className="bell-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z" fill="currentColor"/>
              </svg>
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
            {notifOpen && (
              <div className="notif-dropdown card">
                <div className="notif-head">
                  Notifications
                  {notifications.length > 0 && (
                    <span className="notif-count">{notifications.length}</span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="muted">no notifications yet</div>
                ) : (
                  <div style={{display:'grid', gap:6}}>
                    {notifications.map(n => (
                      <div 
                        key={n._id} 
                        className={`notif-item ${!n.read ? 'unread' : ''} ${n.link ? 'clickable' : ''}`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="notif-content">
                          <div className="notif-title">{n.title}</div>
                          {n.body && <div className="notif-body">{n.body}</div>}
                          <div className="notif-time">{formatDate(n.createdAt)}</div>
                        </div>
                        <div className="notif-actions">
                          {!n.read && (
                            <button 
                              className="notif-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n._id);
                              }}
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                          <button 
                            className="notif-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n._id);
                            }}
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            </div>
            <div ref={menuRef} className="profile-wrap">
              <button className="avatar" title="Profile menu" onClick={()=>setOpen(v=>!v)} aria-haspopup="menu" aria-expanded={open}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" />
                ) : (
                  <span>{initials}</span>
                )}
              </button>
              {open && (
                <div role="menu" className="card profile-dropdown">
                  <Link to="/profile" className="btn" onClick={()=>setOpen(false)}>My Profile</Link>
                  <Link to="/settings" className="btn" onClick={()=>setOpen(false)}>Settings</Link>
                  <Link to="/about" className="btn" onClick={()=>setOpen(false)}>About Us</Link>
                  <Link to="/contact" className="btn" onClick={()=>setOpen(false)}>Contact Us</Link>
                  <Link to="/faq" className="btn" onClick={()=>setOpen(false)}>FAQ</Link>
                  <button className="btn" onClick={()=>{ setOpen(false); doLogout(); }}>Logout</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
