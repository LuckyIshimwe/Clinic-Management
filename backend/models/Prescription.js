const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: String, required: true, ref: "Patient" },
  clinicId: { type: String, required: true },
  prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // doctor
  medicines: [
    {
      name: String,
      dosage: String,
      duration: String
    }
  ],
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Prescription", prescriptionSchema);
