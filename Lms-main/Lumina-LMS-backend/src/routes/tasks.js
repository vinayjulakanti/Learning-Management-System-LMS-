const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// POST /api/tasks - create a new task (teacher)
router.post('/tasks', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, student, course, dueDate, priority } = req.body || {};
    
    if (!title || !description || !student || !dueDate) {
      return res.status(400).json({ message: 'Title, description, student, and due date are required' });
    }

    const task = await Task.create({
      title: String(title),
      description: String(description),
      teacher: req.user._id,
      student: student,
      course: course,
      dueDate: new Date(dueDate),
      priority: priority || 'medium'
    });

    // Create notification for student about new task
    try {
      await Notification.create({
        user: student,
        title: '📝 New Task Assigned',
        body: `Your teacher has assigned a new task: "${title}". Due: ${new Date(dueDate).toLocaleDateString()}`,
        link: '/tasks'
      });
    } catch (notificationError) {
      console.error('Failed to create task notification:', notificationError);
    }

    res.status(201).json({ task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// GET /api/tasks - get tasks (teacher sees their assigned tasks, student sees their tasks)
router.get('/tasks', auth(), async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    
    if (userRole === 'student') {
      // Students can see tasks assigned to them
      const tasks = await Task.find({ 
        student: req.user._id 
      })
      .populate('teacher', 'name')
      .populate('course', 'title')
      .sort({ dueDate: 1 });
      
      res.json({ tasks });
    } else if (userRole === 'teacher' || userRole === 'admin') {
      // Teachers can see tasks they assigned
      const filter = userRole === 'admin' ? {} : { teacher: req.user._id };
      const tasks = await Task.find(filter)
        .populate('student', 'name email')
        .populate('course', 'title')
        .sort({ dueDate: 1 });
      
      res.json({ tasks });
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// PUT /api/tasks/:id - update task (teacher)
router.put('/tasks/:id', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, dueDate, priority, status, feedback, grade } = req.body || {};
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title: String(title) }),
        ...(description && { description: String(description) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(priority && { priority: String(priority) }),
        ...(status && { status: String(status) }),
        ...(feedback !== undefined && { feedback: String(feedback) }),
        ...(grade && { grade: String(grade) }),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('student', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Create notification if status changed to completed
    if (status === 'completed' && task.student) {
      try {
        await Notification.create({
          user: task.student._id,
          title: '✅ Task Completed',
          body: `Your task "${task.title}" has been marked as completed.`,
          link: '/tasks'
        });
      } catch (notificationError) {
        console.error('Failed to create completion notification:', notificationError);
      }
    }

    res.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// PUT /api/tasks/:id/submit - submit task (student)
router.put('/tasks/:id/submit', auth(), requireRole('student'), async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        submittedAt: new Date(),
        completedAt: new Date()
      },
      { new: true }
    ).populate('teacher', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Create notification for teacher
    try {
      await Notification.create({
        user: task.teacher._id,
        title: '📤 Task Submitted',
        body: `A student has submitted the task: "${task.title}"`,
        link: '/tasks'
      });
    } catch (notificationError) {
      console.error('Failed to create submission notification:', notificationError);
    }

    res.json({ task });
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({ message: 'Failed to submit task' });
  }
});

// DELETE /api/tasks/:id - delete task (teacher/admin)
router.delete('/tasks/:id', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

module.exports = router;
