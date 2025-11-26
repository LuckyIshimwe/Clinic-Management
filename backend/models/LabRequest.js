const mongoose = require('mongoose');

const labRequestSchema = new mongoose.Schema({
  patientId: { type: String, required: true, ref: "Patient" },
  clinicId: { type: String, required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  labTechnician: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  testType: { type: String, required: true }, 
  results: String,
  status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
  requestedAt: { type: Date, default: Date.now },
  completedAt: Date ,
   status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model("LabRequest", labRequestSchema);
