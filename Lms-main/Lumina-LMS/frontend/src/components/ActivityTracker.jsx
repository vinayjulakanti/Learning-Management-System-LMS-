import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ActivityAPI } from '../api/client';

export default function ActivityTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const activeSeconds = useRef(0);
  const idleSeconds = useRef(0);
  const lastActive = useRef(Date.now());
  const pathRef = useRef(location.pathname);

  // Keep track of current route path for heartbeat reporting
  useEffect(() => {
    pathRef.current = location.pathname;
    
    // Also log page transitions or course views
    if (!user) return;
    
    const logPageView = async () => {
      try {
        const path = location.pathname;
        if (path.startsWith('/courses/')) {
          const match = path.match(/^\/courses\/([a-f0-9]{24})/);
          if (match && match[1]) {
            await ActivityAPI.log({
              activityType: 'course_opened',
              courseId: match[1]
            });
          }
        }
      } catch (err) {
        console.error('Failed to log page view:', err);
      }
    };
    logPageView();
  }, [location.pathname, user]);

  useEffect(() => {
    if (!user) return;

    // Reset last active on start
    lastActive.current = Date.now();

    const handleUserActivity = () => {
      lastActive.current = Date.now();
    };

    // Events to detect activity
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, handleUserActivity));

    // Timer to accumulate active/idle seconds
    const secTimer = setInterval(() => {
      const idleTime = Date.now() - lastActive.current;
      if (idleTime < 5 * 60 * 1000) { // 5 minutes idle threshold
        activeSeconds.current += 1;
      } else {
        idleSeconds.current += 1;
      }
    }, 1000);

    // Heartbeat reporting timer (every 10 seconds)
    const reportTimer = setInterval(async () => {
      if (activeSeconds.current === 0 && idleSeconds.current === 0) return;

      const path = pathRef.current;
      let courseId = null;
      if (path.startsWith('/courses/')) {
        const match = path.match(/^\/courses\/([a-f0-9]{24})/);
        if (match && match[1]) courseId = match[1];
      }

      try {
        await ActivityAPI.heartbeat({
          activeSeconds: activeSeconds.current,
          idleSeconds: idleSeconds.current,
          courseId
        });
        // Reset counters on successful heartbeat
        activeSeconds.current = 0;
        idleSeconds.current = 0;
      } catch (err) {
        console.error('Heartbeat reporting failed:', err);
      }
    }, 10000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleUserActivity));
      clearInterval(secTimer);
      clearInterval(reportTimer);
    };
  }, [user]);

  return null; // Silent component
}
