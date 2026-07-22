require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./src/config/db');
const Course = require('./src/models/Course');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Connect DB
connectDB()
  .then(async () => {
    try {
      const n = await Course.countDocuments();
      if (n === 0) {
        await Course.insertMany([
          { title: 'Data Structures', description: 'Stacks, queues, trees, and graphs with hands-on practice', duration: '10 weeks' },
          { title: 'Database Management Systems', description: 'Relational models, SQL, transactions, and normalization', duration: '8 weeks' },
          { title: 'Artificial Intelligence', description: 'Search, knowledge representation, and basic ML', duration: '12 weeks' },
          { title: 'Web Development', description: 'Frontend and backend fundamentals to build full-stack apps', duration: '6 weeks' },
        ]);
        console.log('Seeded sample courses');
      }
    } catch (err) {
      console.warn('Course seeding skipped:', err.message);
    }
  })
  .catch((e) => {
    console.error('Mongo connect error:', e.message);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./src/routes/auth'));
const OAUTH_ENABLED = (process.env.OAUTH_ENABLED || 'false').toLowerCase() === 'true';
if (OAUTH_ENABLED) {
  app.use('/api/auth', require('./src/routes/oauth'));
}
app.use('/api/courses', require('./src/routes/courses'));
app.use('/api', require('./src/routes/enrollments'));
app.use('/api', require('./src/routes/assignments'));
app.use('/api', require('./src/routes/notifications'));
app.use('/api', require('./src/routes/grades'));
app.use('/api', require('./src/routes/content'));
app.use('/api', require('./src/routes/admin'));
app.use('/api', require('./src/routes/attendance'));
app.use('/api', require('./src/routes/leaves'));
app.use('/api', require('./src/routes/fees'));
app.use('/api', require('./src/routes/certificates'));
app.use('/api', require('./src/routes/tasks'));
app.use('/api/activity', require('./src/routes/activity'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
