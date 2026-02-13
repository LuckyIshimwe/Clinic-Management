const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  section: {
    type: String,
    default: ""
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ["Male", "Female"],
    required: true
  },
  familyName: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
    default: "Unknown"
  },
  // Parent/Guardian Information
  parentContact: {
    fatherName: String,
    fatherPhone: String,
    motherName: String,
    motherPhone: String,
    guardianName: String,
    guardianPhone: String,
    emergencyPhone: String
  },
  // Medical Information
  allergies: {
    type: String,
    default: ""
  },
  chronicConditions: {
    type: String,
    default: ""
  },
  currentMedications: {
    type: String,
    default: ""
  },
  // Status
  status: {
    type: String,
    enum: ["Active", "Graduated", "Transferred", "Inactive"],
    default: "Active"
  },
  schoolId: {
    type: String,
    required: true
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});

// Indexes for faster queries
studentSchema.index({ schoolId: 1, studentId: 1 });
studentSchema.index({ schoolId: 1, fullName: 1 });
studentSchema.index({ schoolId: 1, grade: 1 });
studentSchema.index({ schoolId: 1, familyName: 1 });

module.exports = mongoose.model("Student", studentSchema);