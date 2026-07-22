const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['monthly', 'one-time', 'semester', 'annual']
  },
  dueDate: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  applicableTo: {
    type: String,
    enum: ['all', 'specific-students', 'specific-courses'],
    default: 'all'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'upi', 'net-banking', 'credit-card'],
    default: 'online'
  },
  transactionId: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Fee', feeSchema);
