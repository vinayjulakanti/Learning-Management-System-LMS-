const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// GET /api/attendance?date=YYYY-MM-DD[&course=ID] - list attendance records for a date (teacher/admin)
router.get('/attendance', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  const date = String(req.query.date || '').slice(0, 10);
  if (!date) return res.status(400).json({ message: 'date is required' });
  const query = { date };
  if (req.query.course) query.course = req.query.course;
  const items = await Attendance.find(query)
    .populate('student', 'name email rollNo')
    .populate('course', 'title');
  res.json({ records: items });
});

// PUT /api/attendance - set attendance status for a student (teacher/admin)
router.put('/attendance', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  console.log('=== ATTENDANCE UPDATE DEBUG START ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('User authenticated:', req.user);
  
  try {
    const { date, courseId, studentId, status } = req.body || {};
    console.log('Attendance update request:', { date, courseId, studentId, status, user: req.user._id });
    
    if (!date || !studentId || !status || !courseId) {
      console.log('Missing fields:', { date, courseId, studentId, status });
      return res.status(400).json({ message: 'Missing required fields: date, courseId, studentId, and status are required' });
    }
    
    if (!['present', 'absent'].includes(String(status))) {
      console.log('Invalid status:', status);
      return res.status(400).json({ message: 'Invalid status. Must be either "present" or "absent"' });
    }
    
    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.log('Invalid date format:', date);
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD format' });
    }
    
    // Validate ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      console.log('Invalid student ID:', studentId);
      return res.status(400).json({ message: 'Invalid student ID' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log('Invalid course ID:', courseId);
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    const updated = await Attendance.findOneAndUpdate(
      { student: studentId, course: courseId, date: String(date).slice(0, 10) },
      { $set: { status: String(status), course: courseId } },
      { new: true, upsert: true }
    );
    
    if (!updated) {
      console.log('Failed to create/update attendance record');
      return res.status(500).json({ message: 'Failed to update attendance record' });
    }
    
    console.log('Attendance updated successfully:', updated);
    
    // Create notification for student about attendance update
    try {
      const student = await require('../models/User').findById(studentId).select('name email');
      const course = await require('../models/Course').findById(courseId).select('title');
      
      if (student && course) {
        await Notification.create({
          user: studentId,
          title: 'Attendance Updated',
          body: `Your attendance for ${course.title} on ${date} has been marked as ${status.toUpperCase()}.`,
          link: '/attendance'
        });
        console.log('Created attendance notification for student');
      }
    } catch (notificationError) {
      console.error('Failed to create attendance notification:', notificationError);
      // Don't fail the whole process
    }
    
    console.log('=== ATTENDANCE UPDATE REQUEST SUCCESS ===');
    res.json({ record: updated });
  } catch (error) {
    console.error('=== ATTENDANCE UPDATE ERROR ===');
    console.error('Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to update attendance: ' + error.message });
  }
});

// GET /api/me/attendance?date=YYYY-MM-DD - current user's status for a date (student)
router.get('/me/attendance', auth(), async (req, res) => {
  try {
    const date = String(req.query.date || '').slice(0, 10);
    if (!date) return res.status(400).json({ message: 'date is required' });
    
    console.log('Getting attendance for student:', req.user._id, 'on date:', date);
    
    // Get attendance records for the student on the specific date
    const records = await Attendance.find({ student: req.user._id, date })
      .populate('course', 'title')
      .populate('student', 'name email rollNo');
    
    console.log('Found attendance records:', records.length);
    
    res.json({ 
      records: records,
      status: records.length > 0 ? records[0].status : null 
    });
  } catch (error) {
    console.error('Error getting student attendance:', error);
    res.status(500).json({ message: 'Failed to get attendance: ' + error.message });
  }
});

// GET /api/me/attendance/all - all attendance records for current user (student)
router.get('/me/attendance/all', auth(), requireRole('student'), async (req, res) => {
  try {
    console.log('Getting all attendance for student:', req.user._id);
    
    const records = await Attendance.find({ student: req.user._id })
      .populate('course', 'title')
      .sort({ date: -1 });
    
    console.log('Found all attendance records:', records.length);
    
    res.json({ records });
  } catch (error) {
    console.error('Error getting all student attendance:', error);
    res.status(500).json({ message: 'Failed to get attendance: ' + error.message });
  }
});

// GET /api/me/attendance/summary - per-course attendance summary for current user
router.get('/me/attendance/summary', auth(), async (req, res) => {
  const pipeline = [
    { $match: { student: req.user._id } },
    { $group: {
      _id: { course: '$course' },
      total: { $sum: 1 },
      presents: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
    }},
    { $lookup: { from: 'courses', localField: '_id.course', foreignField: '_id', as: 'course' } },
    { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, courseId: '$_id.course', courseTitle: '$course.title', total: 1, presents: 1, percentage: { $cond: [ { $gt: ['$total', 0] }, { $round: [ { $multiply: [ { $divide: ['$presents', '$total'] }, 100 ] }, 0 ] }, 0 ] } } }
  ];
  const items = await Attendance.aggregate(pipeline);
  res.json({ summary: items });
});

module.exports = router;
