const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');

// GET /api/courses/:courseId/assignments - list assignments for course
router.get('/courses/:courseId/assignments', async (req, res) => {
  const items = await Assignment.find({ course: req.params.courseId }).sort({ createdAt: -1 });
  res.json({ assignments: items });
});

// POST /api/courses/:courseId/assignments - create assignment (teacher/admin)
router.post('/courses/:courseId/assignments', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  const { title, description, dueDate } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  const assignment = await Assignment.create({ course: req.params.courseId, title, description, dueDate });
  // Ensure course has an owner teacher for visibility in teacher submissions
  try {
    const courseDoc = await Course.findById(req.params.courseId).select('title teacher');
    if (courseDoc && !courseDoc.teacher) {
      courseDoc.teacher = req.user._id;
      await courseDoc.save();
    }
    // Notify enrolled students
    const enrolls = await Enrollment.find({ course: req.params.courseId }).select('student');
    if (enrolls.length) {
      const docs = enrolls.map(e => ({
        user: e.student,
        title: 'New assignment assigned',
        body: `${title} in ${courseDoc?.title || 'a course'}`,
        link: `/courses/${req.params.courseId}`,
      }));
      await Notification.insertMany(docs);
    }
  } catch (_) {}
  res.json({ assignment });
});

// POST /api/courses/:courseId/assignments/:assignmentId/submit - submit assignment (student)
router.post('/courses/:courseId/assignments/:assignmentId/submit', auth(), async (req, res) => {
  const { content, attachments } = req.body;
  if (!content) return res.status(400).json({ message: 'Content is required' });
  try {
    const created = await Submission.create({
      course: req.params.courseId,
      assignment: req.params.assignmentId,
      student: req.user._id,
      content,
      attachments: Array.isArray(attachments) ? attachments.slice(0, 5) : [],
    });
    // Notify course teacher
    try {
      const course = await Course.findById(req.params.courseId).select('title teacher');
      if (course?.teacher) {
        const asg = await Assignment.findById(req.params.assignmentId).select('title');
        await Notification.create({
          user: course.teacher,
          title: 'New submission received',
          body: `${req.user.name || 'A student'} submitted ${asg?.title || 'an assignment'} in ${course.title}`,
          link: `/courses/${req.params.courseId}`,
        });
      }
    } catch (_) {}
    return res.json({ submission: created });
  } catch (e) {
    // if exists, update content
    const updated = await Submission.findOneAndUpdate(
      { assignment: req.params.assignmentId, student: req.user._id },
      { $set: { content, attachments: Array.isArray(attachments) ? attachments.slice(0, 5) : [] } },
      { new: true }
    );
    // Notify course teacher on update as well
    try {
      const course = await Course.findById(req.params.courseId).select('title teacher');
      if (course?.teacher) {
        const asg = await Assignment.findById(req.params.assignmentId).select('title');
        await Notification.create({
          user: course.teacher,
          title: 'Submission updated',
          body: `${req.user.name || 'A student'} updated ${asg?.title || 'an assignment'} in ${course.title}`,
          link: `/courses/${req.params.courseId}`,
        });
      }
    } catch (_) {}
    return res.json({ submission: updated });
  }
});

// GET /api/courses/:courseId/assignments/:assignmentId/submissions - list submissions (teacher/admin)
router.get('/courses/:courseId/assignments/:assignmentId/submissions', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  const subs = await Submission.find({ assignment: req.params.assignmentId })
    .populate('student', 'name email')
    .sort({ createdAt: -1 });
  res.json({ submissions: subs });
});

// POST /api/courses/:courseId/assignments/:assignmentId/submissions/:submissionId/grade - grade submission (teacher/admin)
router.post('/courses/:courseId/assignments/:assignmentId/submissions/:submissionId/grade', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  const { grade } = req.body;
  if (typeof grade !== 'number') return res.status(400).json({ message: 'Grade must be a number' });
  const sub = await Submission.findByIdAndUpdate(req.params.submissionId, { $set: { grade } }, { new: true });
  if (!sub) return res.status(404).json({ message: 'Submission not found' });
  // Notify student about grading
  try {
    const Notification = require('../models/Notification');
    const asg = await Assignment.findById(req.params.assignmentId).select('title');
    const course = await Course.findById(req.params.courseId).select('title');
    await Notification.create({
      user: sub.student,
      title: 'Assignment graded',
      body: `${asg?.title || 'Assignment'} in ${course?.title || 'course'} graded: ${grade}`,
      link: `/courses/${req.params.courseId}`,
    });
  } catch(_) {}
  res.json({ submission: sub });
});

// GET /api/submissions/me - list my submissions
router.get('/submissions/me', auth(), async (req, res) => {
  const subs = await Submission.find({ student: req.user._id })
    .populate('assignment', 'title dueDate')
    .populate('course', 'title')
    .sort({ createdAt: -1 });
  res.json({ submissions: subs });
});

// GET /api/teaching/submissions - list submissions across teacher's courses
router.get('/teaching/submissions', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  const role = (req.user.role || '').toLowerCase();
  let courseFilter = {};
  if (role === 'teacher') {
    const ids = await Course.find({ teacher: req.user._id }).distinct('_id');
    courseFilter = { course: { $in: ids } };
  }
  const subs = await Submission.find(courseFilter)
    .populate('student', 'name email')
    .populate('assignment', 'title')
    .populate('course', 'title')
    .sort({ createdAt: -1 });
  res.json({ submissions: subs });
});

// DELETE /api/courses/:courseId/assignments/:assignmentId - delete assignment (teacher owner or admin)
router.delete('/courses/:courseId/assignments/:assignmentId', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  const course = await Course.findById(req.params.courseId).select('teacher');
  if (!course) return res.status(404).json({ message: 'Course not found' });
  const role = (req.user.role || '').toLowerCase();
  // Auto-claim unowned course
  if (role === 'teacher' && !course.teacher) {
    course.teacher = req.user._id;
    await course.save();
  }
  if (role === 'teacher' && String(course.teacher || '') !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const a = await Assignment.findOne({ _id: req.params.assignmentId, course: req.params.courseId });
  if (!a) return res.status(404).json({ message: 'Assignment not found' });
  await Assignment.deleteOne({ _id: a._id });
  await Submission.deleteMany({ assignment: a._id });
  res.json({ ok: true });
});

module.exports = router;
