const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const SchoolContent = require('../models/SchoolContent');

// GET /api/content/:key - public fetch (key: project, holidays, timetable, attendance, transcript)
router.get('/content/:key', async (req, res) => {
  const key = (req.params.key || '').toLowerCase();
  const doc = await SchoolContent.findOne({ key });
  res.json({ content: doc || { key, title: '', body: '' } });
});

// PUT /api/content/:key - teacher/admin can upsert
router.put('/content/:key', auth(), requireRole('teacher', 'admin'), async (req, res) => {
  const key = (req.params.key || '').toLowerCase();
  const { title = '', body = '' } = req.body || {};
  const doc = await SchoolContent.findOneAndUpdate(
    { key },
    { $set: { key, title, body } },
    { new: true, upsert: true }
  );
  res.json({ content: doc });
});

module.exports = router;
