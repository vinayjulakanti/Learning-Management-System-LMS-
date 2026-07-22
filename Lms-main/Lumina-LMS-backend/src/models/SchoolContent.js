const mongoose = require('mongoose');

const SchoolContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // project, holidays, timetable, attendance, transcript
    title: { type: String },
    body: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SchoolContent', SchoolContentSchema);
