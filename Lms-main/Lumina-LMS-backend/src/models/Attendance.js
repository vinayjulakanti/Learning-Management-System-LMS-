const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true,
    },

    published: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index(
  {
    student: 1,
    course: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model('Attendance', AttendanceSchema);