const router = require('express').Router();
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { auth } = require('../middleware/auth');

// GET /api/enrollments/me - list courses current user enrolled in (with joinedAt and status)
router.get('/enrollments/me', auth(), async (req, res) => {
  try {
    const enrolls = await Enrollment.find({ student: req.user._id })
      .populate('course')
      .sort({ createdAt: -1 });
    const courses = enrolls.map(e => e.course).filter(Boolean);
    const enrollments = enrolls
      .filter(e => !!e.course)
      .map(e => ({ 
        course: e.course, 
        joinedAt: e.createdAt,
        status: e.status || 'enrolled',
        completedAt: e.completedAt
      }));
    res.json({ courses, enrollments });
  } catch (error) {
    console.error('Enrollment fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch enrollments' });
  }
});

module.exports = router;
