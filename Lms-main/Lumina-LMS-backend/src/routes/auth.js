const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

function sign(user) {
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
  return token;
}

router.post('/register', async (req, res) => {
  try {
    const { 
      name, email, password, role, rollNo, teacherId,
      // Phase 2: Detailed Profile Info
      profileImage, admissionNo, admissionYear, school, department, semester,
      courseName, college, curriculumPlan, academicStanding, academicClassification,
      discountCategory, intake, programValidityDate,
      title, firstName, lastName, dob, age, gender, fatherName, motherName,
      address, city, state
    } = req.body;
    
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    const hash = await bcrypt.hash(password, 10);
    const normalizedRole = (role || 'student').toLowerCase();
    
    if (normalizedRole === 'teacher') {
      if (!teacherId) {
        return res.status(400).json({ message: 'Instructor ID is required' });
      }
      if (!/^\d{10}$/.test(teacherId)) {
        return res.status(400).json({ message: 'Instructor ID must be exactly 10 digits' });
      }
    }

    const doc = { 
      name, email: email.toLowerCase(), password: hash, role: normalizedRole,
      profileImage, admissionNo, admissionYear, school, department, semester,
      courseName, college, curriculumPlan, academicStanding, academicClassification,
      discountCategory, intake, programValidityDate,
      title, firstName, lastName, dob, age, gender, fatherName, motherName,
      address, city, state
    };
    
    if (normalizedRole === 'student' && rollNo) doc.rollNo = rollNo;
    if (normalizedRole === 'teacher') doc.teacherId = teacherId;
    
    const user = await User.create(doc);
    
    if (normalizedRole === 'student') {
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          role: 'admin',
          userId: null,
          title: 'New Student Registered',
          message: `Student ${user.name} (${user.email}) has signed up.`,
          type: 'info'
        });
      } catch (_) {}
    }
    
    try {
      const { startSession } = require('../utils/activityHelper');
      await startSession(user._id, req.ip, req.headers['user-agent']);
    } catch (err) {
      console.error('Session start error on register:', err);
    }

    const token = sign(user);
    const safe = user.toObject();
    delete safe.password;
    res.json({ token, user: safe });
  } catch (e) {
    console.error('Registration error details:', e);
    res.status(500).json({ message: 'Registration failed: ' + e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password || '', user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    
    user.lastLogin = new Date();
    await user.save();

    try {
      const Session = require('../models/Session');
      const lastSession = await Session.findOne({ studentId: user._id }).sort({ loginTime: -1 });
      const currentAgent = req.headers['user-agent'] || '';
      if (lastSession && lastSession.userAgent && lastSession.userAgent !== currentAgent) {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: user._id,
          role: user.role,
          title: 'Security Alert: New Login',
          message: `Your account was logged into from a new browser/device.`,
          type: 'warning',
          priority: 'high'
        });
      }
    } catch (_) {}

    try {
      const { startSession } = require('../utils/activityHelper');
      await startSession(user._id, req.ip, req.headers['user-agent']);
    } catch (err) {
      console.error('Session start error on login:', err);
    }

    const token = sign(user);
    const safe = user.toObject();
    delete safe.password;
    res.json({ token, user: safe });
  } catch (e) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/me', auth(), async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/me - update current user's profile
router.put('/me', auth(), async (req, res) => {
  try {
    const allowed = [
      'name', 'rollNo', 'teacherId', 'profileImage', 'admissionNo', 'admissionYear', 
      'school', 'department', 'semester', 'courseName', 'college', 'curriculumPlan', 
      'academicStanding', 'academicClassification', 'discountCategory', 'intake', 
      'programValidityDate', 'title', 'firstName', 'lastName', 'dob', 'age', 
      'gender', 'fatherName', 'motherName', 'address', 'city', 'state'
    ];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    if (req.user.role === 'teacher' && updates.teacherId !== undefined) {
      if (!/^\d{10}$/.test(updates.teacherId)) {
        return res.status(400).json({ message: 'Instructor ID must be exactly 10 digits' });
      }
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: req.user._id,
        role: req.user.role,
        title: 'Profile Updated',
        message: 'Your profile details have been successfully updated.',
        type: 'success'
      });
    } catch (_) {}
    const safe = user.toObject();
    delete safe.password;
    res.json({ user: safe });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.post('/change-password', auth(), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
    if ((newPassword || '').length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: req.user._id,
        role: req.user.role,
        title: 'Password Changed',
        message: 'Your account password was recently changed.',
        type: 'warning',
        priority: 'high'
      });
    } catch (_) {}
    res.json({ message: 'Password changed successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to change password' });
  }
});

router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.json({ message: 'If an account exists, a reset link has been sent' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExp = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const resetUrl = `${process.env.FRONTEND_BASE_URL || 'http://localhost:3001'}/reset?token=${token}`;
    res.json({ message: 'Reset link sent', resetUrl });
  } catch (e) {
    res.status(500).json({ message: 'Failed to process request' });
  }
});

router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findOne({ resetToken: token, resetTokenExp: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    user.resetToken = undefined;
    user.resetTokenExp = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;
