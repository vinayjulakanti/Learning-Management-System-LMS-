const mongoose = require("mongoose");

const courseProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    quizCompleted: {
      type: Boolean,
      default: false,
    },

    score: {
      type: Number,
      default: 0,
    },

    grade: {
      type: String,
      default: "",
    },

    certificateGenerated: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// One progress record per student per course
courseProgressSchema.index(
  { student: 1, course: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "CourseProgress",
  courseProgressSchema
);