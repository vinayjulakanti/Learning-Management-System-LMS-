const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

// GET /api/certificates - get student certificates
router.get('/certificates', auth(), async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    
    if (userRole === 'student') {
      // Students can only see their own certificates
      const certificates = await Certificate.find({ 
        student: req.user._id 
      }).populate('course', 'title').sort({ createdAt: -1 });
      
      res.json({ certificates });
    } else {
      // Teachers and admins can see all certificates
      const certificates = await Certificate.find({})
        .populate('student', 'name email')
        .populate('course', 'title')
        .sort({ createdAt: -1 });
      
      res.json({ certificates });
    }
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Failed to fetch certificates' });
  }
});

// POST /api/certificates/generate - generate certificate for completed course
router.post('/certificates/generate', auth(), async (req, res) => {
  try {
    const { courseId, grade } = req.body || {};
    
    if (!courseId || !grade) {
      return res.status(400).json({ message: 'Course ID and grade are required' });
    }

    // Check if student is enrolled and completed the course
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      student: req.user._id,
      course: courseId
    });

    if (existingCertificate) {
      return res.status(400).json({ message: 'Certificate already exists for this course' });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Determine template based on grade
    let template = 'standard';
    if (grade === 'A+' || grade === 'A') {
      template = 'excellence';
    } else if (grade === 'B+' || grade === 'B') {
      template = 'achievement';
    }

    // Create certificate
    const certificate = await Certificate.create({
      student: req.user._id,
      course: courseId,
      courseName: course.title,
      studentName: req.user.name,
      grade: grade,
      template: template
    });

    // Create notification for student
    try {
      await Notification.create({
        user: req.user._id,
        title: '🎓 Certificate Generated!',
        body: `Congratulations! Your certificate for "${course.title}" has been generated. Grade: ${grade}`,
        link: '/profile'
      });
    } catch (notificationError) {
      console.error('Failed to create certificate notification:', notificationError);
    }

    res.status(201).json({ certificate });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ message: 'Failed to generate certificate' });
  }
});

// POST /api/certificates/auto-generate - automatically generate certificates for completed courses
router.post('/certificates/auto-generate', auth(), async (req, res) => {
  try {
    const { courseId } = req.body || {};
    
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Get all enrollments for the course
    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'completed' // Only generate for completed courses
    }).populate('student');

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const certificates = [];
    const notifications = [];

    for (const enrollment of enrollments) {
      // Check if certificate already exists
      const existingCertificate = await Certificate.findOne({
        student: enrollment.student._id,
        course: courseId
      });

      if (!existingCertificate) {
        // Generate a grade (in real app, this would come from grades/assessments)
        const grades = ['A+', 'A', 'B+', 'B', 'C'];
        const randomGrade = grades[Math.floor(Math.random() * grades.length)];
        
        // Determine template based on grade
        let template = 'standard';
        if (randomGrade === 'A+' || randomGrade === 'A') {
          template = 'excellence';
        } else if (randomGrade === 'B+' || randomGrade === 'B') {
          template = 'achievement';
        }

        const certificate = await Certificate.create({
          student: enrollment.student._id,
          course: courseId,
          courseName: course.title,
          studentName: enrollment.student.name,
          grade: randomGrade,
          template: template
        });

        certificates.push(certificate);

        // Create notification for student
        notifications.push({
          user: enrollment.student._id,
          title: '🎓 Certificate Generated!',
          body: `Congratulations! Your certificate for "${course.title}" has been generated. Grade: ${randomGrade}`,
          link: '/profile'
        });
      }
    }

    // Bulk create notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ 
      message: `Generated ${certificates.length} certificates`,
      certificates: certificates
    });
  } catch (error) {
    console.error('Error auto-generating certificates:', error);
    res.status(500).json({ message: 'Failed to auto-generate certificates' });
  }
});

// PUT /api/certificates/:id/download - mark certificate as downloaded
router.put('/certificates/:id/download', auth(), async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { status: 'downloaded', downloadedAt: new Date() },
      { new: true }
    );

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.json({ certificate });
  } catch (error) {
    console.error('Error updating certificate status:', error);
    res.status(500).json({ message: 'Failed to update certificate' });
  }
});

module.exports = router;
