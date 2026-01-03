const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  medicalHistory: {
    type: String,
    default: ""
  },
  allergies: {
    type: String,
    default: ""
  },
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
    default: "Unknown"
  },
  hospitalized: {
    type: Boolean,
    default: false
  },
  hospitalizedDate: Date,
  referredTo: String,
  referralReason: String,
  referralDate: Date,
  clinicId: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  status: {
    type: String,
    enum: ["Active", "Discharged", "Referred", "Deceased"],
    default: "Active"
  }
}, {
  timestamps: true
});

// Index for faster queries
patientSchema.index({ clinicId: 1, patientId: 1 });
patientSchema.index({ clinicId: 1, fullName: 1 });

module.exports = mongoose.model("Patient", patientSchema);