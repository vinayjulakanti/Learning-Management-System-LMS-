const router = require('express').Router();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/courses - list all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json({ courses });
  } catch (e) {
    console.error('Courses fetch error:', e);
    res.status(500).json({ message: 'Failed to load courses' });
  }
});

// POST /api/courses - create course (teacher/admin)
router.post('/', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, duration, content } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const course = await Course.create({ title, description, duration, content, teacher: req.user._id });
    // Notify all students about new course
    try {
      const User = require('../models/User');
      const Notification = require('../models/Notification');
      const students = await User.find({ role: 'student' }).select('_id');
      if (students.length) {
        const docs = students.map(s => ({
          user: s._id,
          title: 'New course available',
          body: `${title} has been created`,
          link: `/courses/${course._id}`,
        }));
        await Notification.insertMany(docs);
      }
      await Notification.create({
        role: 'admin',
        userId: null,
        title: 'New Course Created',
        message: `Course "${title}" has been created by ${req.user.name}.`,
        type: 'success',
        actionUrl: `/courses/${course._id}`
      });
    } catch(_) {}
    res.json({ course });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create course' });
  }
});

// GET /api/courses/:id - get course by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid course id' });
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ course });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load course' });
  }
});

// POST /api/courses/:id/claim - set current teacher as owner if unowned
router.post('/:id/claim', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid course id' });
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.teacher) return res.status(400).json({ message: 'Course already has a teacher' });
    course.teacher = req.user._id;
    await course.save();
    res.json({ course });
  } catch (e) {
    res.status(500).json({ message: 'Failed to claim course' });
  }
});

// PUT /api/courses/:id - update course (teacher owner or admin)
router.put('/:id', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid course id' });
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const role = (req.user.role || '').toLowerCase();
    if (role === 'teacher' && String(course.teacher || '') !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { title, description, duration, content } = req.body;
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (duration !== undefined) course.duration = duration;
    if (content !== undefined) course.content = content;
    await course.save();
    res.json({ course });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update course' });
  }
});

// DELETE /api/courses/:id - delete course (teacher owner or admin)
router.delete('/:id', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid course id' });
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    // Allow any teacher or admin to delete the course
    await Enrollment.deleteMany({ course: course._id });
    await course.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete course' });
  }
});

// POST /api/courses/:id/enroll - enroll current user (student)
router.post('/:id/enroll', auth(), async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    // Create enrollment
    await Enrollment.create({ student: req.user._id, course: courseId });
    
    // Create notification for successful enrollment
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        user: req.user._id,
        title: 'Course Enrollment',
        body: `you enrolled in folloeing course ${course.title} at ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}`,
        link: `/courses/${course._id}`,
      });
      await Notification.create({
        role: 'admin',
        userId: null,
        title: 'Student Enrolled in Course',
        message: `${req.user.name} enrolled in "${course.title}".`,
        type: 'info',
        actionUrl: `/courses/${course._id}`
      });
    } catch (_) {
      // Ignore notification errors
    }
    
  } catch (e) {
    // ignore duplicate key error
  }
  res.json({ ok: true });
});

// POST /api/courses/:id/complete - mark course as completed and generate certificate
router.post('/:id/complete', auth(), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { grade } = req.body || {};
    
    console.log('Course completion request:', { courseId, userId: req.user._id, grade });
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('Course not found:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if enrollment exists
    let enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });
    
    console.log('Found enrollment:', enrollment);
    
    // If no enrollment exists, create one first
    if (!enrollment) {
      console.log('No enrollment found for user:', req.user._id, 'course:', courseId);
      console.log('Creating enrollment automatically...');
      
      try {
        enrollment = await Enrollment.create({ 
          student: req.user._id, 
          course: courseId,
          status: 'enrolled',
          createdAt: new Date()
        });
        console.log('Auto-enrollment created:', enrollment._id);
      } catch (enrollError) {
        console.error('Failed to create enrollment:', enrollError);
        return res.status(500).json({ message: 'Failed to enroll in course. Please try enrolling first.' });
      }
    }
    
    // Update enrollment status to completed
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    await enrollment.save();
    
    console.log('Enrollment updated to completed');
    
    // Generate certificate
    try {
      const Certificate = require('../models/Certificate');
      
      // Check if certificate already exists
      const existingCertificate = await Certificate.findOne({
        student: req.user._id,
        course: courseId
      });
      
      if (!existingCertificate) {
        // Determine template based on grade
        let template = 'standard';
        if (grade === 'A+' || grade === 'A') {
          template = 'excellence';
        } else if (grade === 'B+' || grade === 'B') {
          template = 'achievement';
        }
        
        const certificate = await Certificate.create({
          student: req.user._id,
          course: courseId,
          courseName: course.title,
          studentName: req.user.name,
          grade: grade || 'B',
          template: template,
          completionDate: new Date(),
          issueDate: new Date()
        });
        
        console.log('Certificate created:', certificate._id);
        
        // Create notification for certificate
        const Notification = require('../models/Notification');
        await Notification.create({
          user: req.user._id,
          title: 'Certificate Completed',
          body: `Completion of certificate for course ${course.title}`,
          link: '/profile'
        });
        await Notification.create({
          role: 'admin',
          userId: null,
          title: 'Course Completed by Student',
          message: `${req.user.name} has completed the course "${course.title}" with grade ${grade || 'B'}.`,
          type: 'success',
          actionUrl: `/courses/${course._id}`
        });
      } else {
        console.log('Certificate already exists:', existingCertificate._id);
      }
    } catch (certError) {
      console.error('Failed to generate certificate:', certError);
      // Don't fail the whole process if certificate generation fails
    }
    
    res.json({ ok: true, message: 'Course completed successfully!' });
  } catch (e) {
    console.error('Error completing course:', e);
    res.status(500).json({ message: 'Failed to complete course: ' + e.message });
  }
});

// GET /api/courses/:id/students - roster for a course (teacher/admin)
router.get('/:id/students', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid course id' });
    const enrolls = await Enrollment.find({ course: id }).populate('student', 'name email rollNo');
    res.json({ students: enrolls.map(e => e.student) });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load students' });
  }
});

module.exports = router;
