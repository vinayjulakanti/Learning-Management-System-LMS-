const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Enrollment = require('../models/Enrollment');

// All routes here require admin
router.use(auth(), requireRole('admin'));

// GET /api/admin/summary - high-level metrics for dashboard widgets
router.get('/admin/summary', async (req, res) => {
  const [users, courses, assignments, enrollments] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Assignment.countDocuments(),
    Enrollment.countDocuments(),
  ]);
  res.json({ summary: { users, courses, assignments, enrollments } });
});

// GET /api/admin/users - list users (minimal fields)
router.get('/admin/users', async (req, res) => {
  const users = await User.find({}, 'name email role rollNo teacherId createdAt lastLogin').sort({ lastLogin: -1, createdAt: -1 });
  res.json({ users });
});

// PUT /api/admin/users/:id/role - update a user's role (student/teacher/admin)
router.put('/admin/users/:id/role', async (req, res) => {
  const role = String(req.body.role || '').toLowerCase();
  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { role } }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const safe = user.toObject();
  delete safe.password;
  res.json({ user: safe });
});

module.exports = router;
