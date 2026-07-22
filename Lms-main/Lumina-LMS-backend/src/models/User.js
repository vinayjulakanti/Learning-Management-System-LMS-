const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    mobileNumber: { type: String, trim: true },
    rollNo: { type: String, trim: true }, // student only (optional)
    teacherId: { type: String, trim: true }, // teacher only (optional)
    resetToken: { type: String, index: true },
    resetTokenExp: { type: Date },
    googleId: { type: String, index: true, sparse: true },
    microsoftId: { type: String, index: true, sparse: true },
    lastLogin: { type: Date },
    
    // Detailed Profile Info (From Registration Phase 2)
    // Academic Details
    profileImage: { type: String }, // URL or base64
    admissionNo: { type: String },
    admissionYear: { type: String },
    school: { type: String },
    department: { type: String },
    semester: { type: String },
    courseName: { type: String },
    college: { type: String },
    curriculumPlan: { type: String },
    academicStanding: { type: String },
    academicClassification: { type: String },
    discountCategory: { type: String },
    intake: { type: String },
    programValidityDate: { type: String },

    // Personal Details
    title: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    dob: { type: Date },
    age: { type: Number },
    gender: { type: String },
    fatherName: { type: String },
    motherName: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },

  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
