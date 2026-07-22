const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromDate: { type: String, required: true }, // YYYY-MM-DD
    toDate: { type: String, required: true },   // YYYY-MM-DD
    reason: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', LeaveSchema);
