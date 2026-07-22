const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  grade: {
    type: String,
    required: true
  },
  completionDate: {
    type: Date,
    default: Date.now
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['issued', 'downloaded', 'revoked'],
    default: 'issued'
  },
  instructorSignature: {
    type: String,
    default: 'Course Instructor'
  },
  directorSignature: {
    type: String,
    default: 'Academic Director'
  },
  template: {
    type: String,
    enum: ['standard', 'excellence', 'achievement'],
    default: 'standard'
  }
}, {
  timestamps: true
});

// Generate unique certificate ID
certificateSchema.pre('save', function(next) {
  if (this.isNew && !this.certificateId) {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.certificateId = `CERT-${year}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
