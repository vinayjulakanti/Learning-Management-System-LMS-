const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachments: [
      {
        name: String,
        mime: String,
        size: Number,
        data: String, // data URL (base64) for demo; not for production
      },
    ],
    grade: { type: Number },
  },
  { timestamps: true }
);

SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
