const mongoose = require('mongoose');
const Session = require('./src/models/Session');
const ActivityLog = require('./src/models/ActivityLog');
const User = require('./src/models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/lms_db';

async function test() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  try {
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('No student found in DB.');
      process.exit(0);
    }
    const studentId = student._id;
    console.log(`Found student: ${student.name} (${studentId})`);

    const sessions = await Session.find({ studentId }).populate('coursesAccessed');
    console.log(`Found ${sessions.length} sessions`);
    const logs = await ActivityLog.find({ studentId }).sort({ timestamp: -1 });
    console.log(`Found ${logs.length} logs`);

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

      if (s.loginTime) {
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
      }
    });

    // Group sessions by day
    const dailyMap = {};
    sessions.forEach(s => {
      if (!s.loginTime) {
        console.warn('Session has no loginTime:', s._id);
        return;
      }
      let dateKey;
      try {
        dateKey = new Date(s.loginTime).toISOString().split('T')[0];
      } catch (err) {
        console.warn('Failed to parse loginTime to ISO:', s.loginTime, s._id);
        return;
      }

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          firstLogin: s.loginTime,
          lastLogout: s.logoutTime || s.lastHeartbeat || s.loginTime,
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
      const logoutVal = s.logoutTime || s.lastHeartbeat || s.loginTime;
      if (logoutVal > day.lastLogout) day.lastLogout = logoutVal;

      if (s.coursesAccessed) {
        s.coursesAccessed.forEach(c => {
          if (c) day.courses.add(c.title || c._id.toString());
        });
      }
      if (s.lessonsVisited) {
        s.lessonsVisited.forEach(l => {
          if (l) day.lessons.add(l);
        });
      }
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

    console.log('Daily Summary Length:', dailySummary.length);
    console.log('Aggregates:', {
      todayActiveHours: parseFloat((todayActiveSeconds / 3600).toFixed(2)),
      weekActiveHours: parseFloat((weekActiveSeconds / 3600).toFixed(2)),
      monthActiveHours: parseFloat((monthActiveSeconds / 3600).toFixed(2)),
      lifetimeActiveHours: parseFloat((lifetimeActiveSeconds / 3600).toFixed(2))
    });
    console.log('SUCCESS');
  } catch (err) {
    console.error('CRASHED WITH ERROR:', err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
