const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
  patientId: { type: String, required: true, ref: "Patient" },
  clinicId: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // doctor/nurse
  diagnosis: String,
  treatment: String,
  allergies: [String],
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("MedicalHistory", medicalHistorySchema);
