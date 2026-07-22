const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');

// POST /api/leaves - apply for leave (student)
router.post('/leaves', auth(), requireRole('student'), async (req, res) => {
  try {
    const { fromDate, toDate, reason } = req.body || {};
    console.log('Leave application request:', { fromDate, toDate, reason, student: req.user._id });
    
    if (!fromDate || !toDate) {
      console.log('Missing required fields:', { fromDate, toDate });
      return res.status(400).json({ message: 'fromDate and toDate are required' });
    }
    
    // Validate dates
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) {
      return res.status(400).json({ message: 'fromDate cannot be after toDate' });
    }
    
    const doc = await Leave.create({ 
      student: req.user._id, 
      fromDate: String(fromDate).slice(0,10), 
      toDate: String(toDate).slice(0,10), 
      reason: String(reason||'').slice(0,500) 
    });
    
    console.log('Leave application created successfully:', doc._id);
    
    // Create notification for teachers about new leave request
    try {
      const teachers = await require('../models/User').find({ role: { $in: ['teacher', 'admin'] } }).select('_id name email');
      console.log('Found teachers for notification:', teachers.length);
      
      if (teachers.length > 0) {
        const notifications = teachers.map(teacher => ({
          user: teacher._id,
          title: 'New Leave Request',
          body: `${req.user.name || 'A student'} has applied for leave from ${fromDate} to ${toDate}. Reason: ${reason || 'No reason provided'}`,
          link: '/leave-approvals'
        }));

        await Notification.insertMany(notifications);
        console.log(`Created ${notifications.length} notifications for teachers`);
      }
    } catch (notificationError) {
      console.error('Failed to create leave notifications:', notificationError);
      // Don't fail the whole process
    }
    
    res.status(201).json({ leave: doc });
  } catch (error) {
    console.error('Error creating leave application:', error);
    res.status(500).json({ message: 'Failed to apply for leave: ' + error.message });
  }
});

// GET /api/leaves/me - my leaves (student)
router.get('/leaves/me', auth(), async (req, res) => {
  const items = await Leave.find({ student: req.user._id }).sort({ createdAt: -1 });
  res.json({ leaves: items });
});

// GET /api/leaves/pending - list pending leaves (teacher/admin)
router.get('/leaves/pending', auth(), requireRole('teacher','admin'), async (req, res) => {
  const items = await Leave.find({ status: 'pending' })
    .populate('student', 'name email rollNo')
    .sort({ createdAt: -1 });
  res.json({ leaves: items });
});

async function decide(req, res, status) {
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { $set: { status, approver: req.user._id } },
    { new: true }
  ).populate('student', 'name');
  if (!leave) return res.status(404).json({ message: 'Not found' });
  try {
    await Notification.create({
      user: leave.student._id,
      title: `Leave ${status}`,
      body: `Your leave request from ${leave.fromDate} to ${leave.toDate} was ${status}.`,
      link: '/leave',
    });
  } catch(_) {}
  res.json({ leave });
}

// POST /api/leaves/:id/approve - approve (teacher/admin)
router.post('/leaves/:id/approve', auth(), requireRole('teacher','admin'), async (req, res) => decide(req,res,'approved'));

// POST /api/leaves/:id/reject - reject (teacher/admin)
router.post('/leaves/:id/reject', auth(), requireRole('teacher','admin'), async (req, res) => decide(req,res,'rejected'));

module.exports = router;
