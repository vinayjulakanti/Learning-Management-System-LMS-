const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms_db';

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');
}

module.exports = { connectDB };
