const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  lessonId: { type: String, default: null },
  activityType: { 
    type: String, 
    required: true,
    enum: [
      'login', 'logout', 'course_opened', 'lesson_started', 'lesson_completed', 
      'quiz_started', 'quiz_submitted', 'assignment_opened', 'assignment_submitted', 
      'video_started', 'video_paused', 'video_completed', 'file_downloaded', 'page_view'
    ]
  },
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
