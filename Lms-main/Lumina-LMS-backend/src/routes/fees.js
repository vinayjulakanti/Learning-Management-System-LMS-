const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');

// POST /api/fees - create a new fee (teacher/admin)
router.post('/fees', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { name, amount, type, dueDate, description, applicableTo } = req.body || {};
    console.log('Fee creation request received:', { name, amount, type, dueDate, applicableTo, user: req.user._id });
    
    // Validate required fields
    if (!name || !amount || !type || !dueDate) {
      console.log('Missing required fields:', { name: !!name, amount: !!amount, type: !!type, dueDate: !!dueDate });
      return res.status(400).json({ message: 'Name, amount, type, and due date are required' });
    }

    // Validate amount is a number
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.log('Invalid amount:', amount);
      return res.status(400).json({ message: 'Amount must be a valid positive number' });
    }

    console.log('Creating fee with validated data...');
    const fee = await Fee.create({
      name: String(name),
      amount: parsedAmount,
      type: String(type), // monthly, one-time, semester, annual
      dueDate: String(dueDate),
      description: String(description || ''),
      applicableTo: applicableTo || 'all', // all, specific-students, specific-courses
      createdBy: req.user._id
    });

    console.log('Fee created successfully:', fee._id);

    // Create notification for students about new fee (with error handling)
    try {
      console.log('Creating student notifications...');
      const User = require('../models/User');
      const students = applicableTo === 'all' 
        ? await User.find({ role: 'student' }).select('_id name email')
        : []; // TODO: Handle specific students/courses logic
      
      console.log('Found students for notification:', students.length);
      
      if (students.length > 0) {
        const notifications = students
          .filter(student => student && student._id) // Filter out invalid students
          .map(student => ({
            user: student._id,
            title: 'New Fee Added',
            body: `A new fee "${name}" of ₹${parsedAmount} has been added. Due date: ${dueDate}.`,
            link: '/billing'
          }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
          console.log(`Created ${notifications.length} notifications for students`);
        }
      }
    } catch (notificationError) {
      console.error('Failed to create fee notifications:', notificationError);
      // Don't fail the whole process if notifications fail
    }

    console.log('Sending success response');
    res.status(201).json({ fee });
  } catch (error) {
    console.error('Error creating fee:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to create fee: ' + error.message });
  }
});

// GET /api/fees - get all fees (admin/teacher) or student fees (student)
router.get('/fees', auth(), async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    
    if (userRole === 'student') {
      // Students can see all fees that apply to them
      const fees = await Fee.find({ 
        $or: [
          { applicableTo: 'all' },
          // TODO: Add logic for specific students/courses
        ]
      }).sort({ createdAt: -1 });
      
      res.json({ fees });
    } else {
      // Teachers and admins can see all fees
      const fees = await Fee.find({}).sort({ createdAt: -1 });
      res.json({ fees });
    }
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ message: 'Failed to fetch fees' });
  }
});

// PUT /api/fees/:id - update fee (admin only)
router.put('/fees/:id', auth(), requireRole('admin'), async (req, res) => {
  try {
    const { name, amount, type, dueDate, description, applicableTo } = req.body || {};
    
    const fee = await Fee.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: String(name) }),
        ...(amount && { amount: Number(amount) }),
        ...(type && { type: String(type) }),
        ...(dueDate && { dueDate: String(dueDate) }),
        ...(description !== undefined && { description: String(description) }),
        ...(applicableTo && { applicableTo: String(applicableTo) }),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    res.json({ fee });
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(500).json({ message: 'Failed to update fee' });
  }
});

// DELETE /api/fees/:id - delete fee (admin only)
router.delete('/fees/:id', auth(), requireRole('admin'), async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    res.json({ message: 'Fee deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ message: 'Failed to delete fee' });
  }
});

// POST /api/fees/:id/pay - mark fee as paid (student)
router.post('/fees/:id/pay', auth(), requireRole('student'), async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body || {};
    
    const fee = await Fee.findByIdAndUpdate(
      req.params.id,
      {
        status: 'paid',
        paidBy: req.user._id,
        paidAt: new Date(),
        paymentMethod: paymentMethod || 'online',
        transactionId: transactionId || `TXN${Date.now()}`
      },
      { new: true }
    );

    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    res.json({ fee });
  } catch (error) {
    console.error('Error marking fee as paid:', error);
    res.status(500).json({ message: 'Failed to process payment' });
  }
});

module.exports = router;
