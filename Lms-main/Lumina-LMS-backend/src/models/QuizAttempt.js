const mongoose = require("mongoose");

const QuizAttemptSchema = new mongoose.Schema({

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },

  score: {
    type: Number,
    default: 0
  },

  percentage: {
    type: Number,
    default: 0
  },

  grade: {
    type: String,
    default: "F"
  },

  passed: {
    type: Boolean,
    default: false
  },

  attempt: {
    type: Number,
    default: 1
  },

  answers: [{
    question: String,
    selectedAnswer: Number,
    correctAnswer: Number,
    isCorrect: Boolean
  }]

}, {
  timestamps: true
});

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);