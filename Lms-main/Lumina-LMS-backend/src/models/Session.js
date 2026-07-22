const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  loginTime: { type: Date, required: true, index: true },
  logoutTime: { type: Date, default: null, index: true },
  lastHeartbeat: { type: Date, required: true, index: true },
  activeDuration: { type: Number, default: 0 }, // in seconds
  idleDuration: { type: Number, default: 0 },   // in seconds
  coursesAccessed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  lessonsVisited: [{ type: String }],
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' }
});

module.exports = mongoose.model('Session', SessionSchema);
