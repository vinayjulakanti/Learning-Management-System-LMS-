const mongoose = require("mongoose");

const TimetableSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },

  day: {
    type: String,
    required: true
  },

  subject: String,

  faculty: {
  type: String,
  required: true
},
  startTime: String,

  endTime: String,

  room: String

}, { timestamps: true });

module.exports = mongoose.model("Timetable", TimetableSchema);