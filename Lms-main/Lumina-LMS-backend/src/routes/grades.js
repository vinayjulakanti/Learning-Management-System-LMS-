const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Submission = require('../models/Submission');

// GET /api/grades/me - list graded submissions for current user
router.get('/grades/me', auth(), async (req, res) => {
  const subs = await Submission.find({ student: req.user._id, grade: { $ne: null } })
    .populate('course')
    .populate('assignment')
    .sort({ updatedAt: -1 });
  const grades = subs.map(s => ({
    _id: s._id,
    grade: s.grade,
    course: s.course ? { _id: s.course._id, title: s.course.title } : undefined,
    assignment: s.assignment ? { _id: s.assignment._id, title: s.assignment.title } : undefined,
    attachments: s.attachments || [],
    content: s.content
  }));
  res.json({ grades });
});

module.exports = router;
