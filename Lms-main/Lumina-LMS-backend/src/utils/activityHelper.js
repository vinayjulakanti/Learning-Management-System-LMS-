const Session = require('../models/Session');
const ActivityLog = require('../models/ActivityLog');

async function startSession(studentId, ipAddress, userAgent) {
  const now = new Date();
  
  // Close any existing active sessions that were left open
  await Session.updateMany(
    { studentId, logoutTime: null },
    { $set: { logoutTime: now } }
  );

  const session = await Session.create({
    studentId,
    loginTime: now,
    lastHeartbeat: now,
    activeDuration: 0,
    idleDuration: 0,
    ipAddress,
    userAgent
  });

  await ActivityLog.create({
    studentId,
    activityType: 'login',
    timestamp: now,
    ipAddress,
    userAgent
  });

  return session;
}

async function closeStaleSessions(studentId) {
  const threshold = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes threshold
  const query = { logoutTime: null, lastHeartbeat: { $lt: threshold } };
  if (studentId) {
    query.studentId = studentId;
  }

  const staleSessions = await Session.find(query);
  for (const s of staleSessions) {
    s.logoutTime = s.lastHeartbeat;
    await s.save();

    await ActivityLog.create({
      studentId: s.studentId,
      activityType: 'logout',
      timestamp: s.lastHeartbeat,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent
    });
  }
}

module.exports = { startSession, closeStaleSessions };
