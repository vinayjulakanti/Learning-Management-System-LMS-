const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');
const Session = require('../models/Session');
const User = require('../models/User');
const { closeStaleSessions } = require('../utils/activityHelper');

// 1. Heartbeat to record active/idle time
router.post('/heartbeat', auth(), async (req, res) => {
  try {
    const { activeSeconds, idleSeconds, courseId, lessonId } = req.body;
    const studentId = req.user._id;

    // Run closeStaleSessions for this student to make sure we don't pile up stale sessions
    await closeStaleSessions(studentId);

    // Find if there is an active session
    let session = await Session.findOne({ studentId, logoutTime: null });
    const now = new Date();

    if (!session) {
      // Create new session
      const startTime = new Date(now.getTime() - (activeSeconds + idleSeconds) * 1000);
      session = await Session.create({
        studentId,
        loginTime: startTime,
        lastHeartbeat: now,
        activeDuration: activeSeconds,
        idleDuration: idleSeconds,
        coursesAccessed: courseId ? [courseId] : [],
        lessonsVisited: lessonId ? [lessonId] : [],
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Log login activity
      await ActivityLog.create({
        studentId,
        activityType: 'login',
        timestamp: startTime,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } else {
      // Update session
      session.activeDuration = (session.activeDuration || 0) + activeSeconds;
      session.idleDuration = (session.idleDuration || 0) + idleSeconds;
      session.lastHeartbeat = now;
      if (courseId && !session.coursesAccessed.includes(courseId)) {
        session.coursesAccessed.push(courseId);
      }
      if (lessonId && !session.lessonsVisited.includes(lessonId)) {
        session.lessonsVisited.push(lessonId);
      }
      await session.save();
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Heartbeat error:', e);
    res.status(500).json({ message: 'Heartbeat failed' });
  }
});

// 2. Custom action log
router.post('/log', auth(), async (req, res) => {
  try {
    const { activityType, courseId, lessonId } = req.body;
    const studentId = req.user._id;

    const log = await ActivityLog.create({
      studentId,
      activityType,
      courseId: courseId || null,
      lessonId: lessonId || null,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Make sure they have an active session
    let session = await Session.findOne({ studentId, logoutTime: null });
    if (!session) {
      const now = new Date();
      session = await Session.create({
        studentId,
        loginTime: now,
        lastHeartbeat: now,
        activeDuration: 0,
        idleDuration: 0,
        coursesAccessed: courseId ? [courseId] : [],
        lessonsVisited: lessonId ? [lessonId] : [],
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      await ActivityLog.create({
        studentId,
        activityType: 'login',
        timestamp: now,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } else {
      if (courseId && !session.coursesAccessed.includes(courseId)) {
        session.coursesAccessed.push(courseId);
        await session.save();
      }
      if (lessonId && !session.lessonsVisited.includes(lessonId)) {
        session.lessonsVisited.push(lessonId);
        await session.save();
      }
    }

    res.json({ success: true, log });
  } catch (e) {
    console.error('Log activity error:', e);
    res.status(500).json({ message: 'Failed to log activity' });
  }
});

// 3. Explicit logout
router.post('/logout', auth(), async (req, res) => {
  try {
    const studentId = req.user._id;
    const session = await Session.findOne({ studentId, logoutTime: null });
    const now = new Date();

    if (session) {
      session.logoutTime = now;
      session.lastHeartbeat = now;
      await session.save();
    }

    await ActivityLog.create({
      studentId,
      activityType: 'logout',
      timestamp: now,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true });
  } catch (e) {
    console.error('Logout activity error:', e);
    res.status(500).json({ message: 'Failed to record logout activity' });
  }
});

// 4. Get active time summary for student
router.get('/my-summary', auth(), async (req, res) => {
  try {
    const studentId = req.user._id;
    await closeStaleSessions(studentId);

    const sessions = await Session.find({ studentId }).populate('coursesAccessed');
    const logs = await ActivityLog.find({ studentId }).sort({ timestamp: -1 });

    const now = new Date();
    
    // Aggregates
    let lifetimeActiveSeconds = 0;
    let todayActiveSeconds = 0;
    let weekActiveSeconds = 0;
    let monthActiveSeconds = 0;

    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    sessions.forEach(s => {
      const active = s.activeDuration || 0;
      lifetimeActiveSeconds += active;

      const date = new Date(s.loginTime);
      if (date >= startOfToday) {
        todayActiveSeconds += active;
      }
      if (date >= startOfWeek) {
        weekActiveSeconds += active;
      }
      if (date >= startOfMonth) {
        monthActiveSeconds += active;
      }
    });

    // Group sessions by day
    const dailyMap = {};
    sessions.forEach(s => {
      const dateKey = new Date(s.loginTime).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          firstLogin: s.loginTime,
          lastLogout: s.logoutTime || s.lastHeartbeat,
          activeDuration: 0,
          idleDuration: 0,
          sessionCount: 0,
          courses: new Set(),
          lessons: new Set()
        };
      }
      const day = dailyMap[dateKey];
      day.activeDuration += s.activeDuration || 0;
      day.idleDuration += s.idleDuration || 0;
      day.sessionCount += 1;

      if (s.loginTime < day.firstLogin) day.firstLogin = s.loginTime;
      const logoutVal = s.logoutTime || s.lastHeartbeat;
      if (logoutVal > day.lastLogout) day.lastLogout = logoutVal;

      s.coursesAccessed.forEach(c => {
        if (c) {
          day.courses.add(c.title || c._id.toString());
        }
      });
      s.lessonsVisited.forEach(l => {
        if (l) {
          day.lessons.add(l);
        }
      });
    });

    const dailySummary = Object.values(dailyMap).map(day => ({
      date: day.date,
      firstLoginTime: day.firstLogin,
      lastLogoutTime: day.lastLogout,
      activeDuration: day.activeDuration,
      idleDuration: day.idleDuration,
      sessionCount: day.sessionCount,
      coursesAccessed: Array.from(day.courses),
      lessonsVisited: Array.from(day.lessons)
    })).sort((a,b) => b.date.localeCompare(a.date));

    // Timeline logs for today
    const todayLogs = logs.filter(l => new Date(l.timestamp) >= startOfToday);

    res.json({
      aggregates: {
        todayActiveHours: parseFloat((todayActiveSeconds / 3600).toFixed(2)),
        weekActiveHours: parseFloat((weekActiveSeconds / 3600).toFixed(2)),
        monthActiveHours: parseFloat((monthActiveSeconds / 3600).toFixed(2)),
        lifetimeActiveHours: parseFloat((lifetimeActiveSeconds / 3600).toFixed(2)),
        todayActiveSeconds,
        weekActiveSeconds,
        monthActiveSeconds,
        lifetimeActiveSeconds
      },
      dailySummary,
      timelineToday: todayLogs
    });

  } catch (e) {
    console.error('Summary error:', e);
    res.status(500).json({ message: 'Failed to retrieve activity summary' });
  }
});

// 5. Admin search students
router.get('/admin/students', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { search } = req.query;
    const query = { role: 'student' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const students = await User.find(query).select('name email rollNo admissionNo');
    res.json({ students });
  } catch (e) {
    res.status(500).json({ message: 'Failed to retrieve students list' });
  }
});

// 6. Admin get student activity report
router.get('/admin/report', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { studentId, startDate, endDate } = req.query;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });

    await closeStaleSessions(studentId);

    const query = { studentId };
    const logsQuery = { studentId };

    if (startDate || endDate) {
      query.loginTime = {};
      logsQuery.timestamp = {};
      if (startDate) {
        query.loginTime.$gte = new Date(startDate);
        logsQuery.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.loginTime.$lte = end;
        logsQuery.timestamp.$lte = end;
      }
    }

    const sessions = await Session.find(query).populate('coursesAccessed');
    const logs = await ActivityLog.find(logsQuery).sort({ timestamp: -1 });
    const student = await User.findById(studentId).select('name email rollNo admissionNo');

    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Summarize
    let totalActiveSeconds = 0;
    const dailyMap = {};

    sessions.forEach(s => {
      totalActiveSeconds += s.activeDuration || 0;
      const dateKey = new Date(s.loginTime).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          firstLogin: s.loginTime,
          lastLogout: s.logoutTime || s.lastHeartbeat,
          activeDuration: 0,
          sessionCount: 0,
          courses: new Set(),
          lessons: new Set()
        };
      }
      const day = dailyMap[dateKey];
      day.activeDuration += s.activeDuration || 0;
      day.sessionCount += 1;
      if (s.loginTime < day.firstLogin) day.firstLogin = s.loginTime;
      const logoutVal = s.logoutTime || s.lastHeartbeat;
      if (logoutVal > day.lastLogout) day.lastLogout = logoutVal;

      s.coursesAccessed.forEach(c => {
        if (c) {
          day.courses.add(c.title || c._id.toString());
        }
      });
      s.lessonsVisited.forEach(l => {
        if (l) {
          day.lessons.add(l);
        }
      });
    });

    const dailySummary = Object.values(dailyMap).map(day => ({
      date: day.date,
      firstLoginTime: day.firstLogin,
      lastLogoutTime: day.lastLogout,
      activeDuration: day.activeDuration,
      sessionCount: day.sessionCount,
      coursesAccessed: Array.from(day.courses),
      lessonsVisited: Array.from(day.lessons)
    })).sort((a,b) => b.date.localeCompare(a.date));

    res.json({
      student,
      totalActiveHours: parseFloat((totalActiveSeconds / 3600).toFixed(2)),
      totalActiveSeconds,
      dailySummary,
      logs
    });

  } catch (e) {
    console.error('Admin report error:', e);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

module.exports = router;
