const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  lastName: String,
  gender: { type: String, enum: ['Male','Female','Other'] },
  dateOfBirth: Date,
  phone: String,
  email: { type: String, sparse: true },
  address: String,
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  emergencyContact: { name: String, phone: String, relation: String },
  patientId: { type: String, required: true }, // something CLINICCODE-0001
  clinicId: {
  type: String,
  required: true
}
,
  // medicalHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MedicalHistory' }],
  medicalHistory: [{ type: String }],
  consultations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' }],
  labRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LabRequest' }],
  hospitalizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hospitalization' }],
  createdAt: { type: Date, default: Date.now },
   hospitalized: { type: Boolean, default: false },
  referredTo: { type: String, default: null },
  referralReason: { type: String, default: "" }
});

module.exports = mongoose.model('Patient', patientSchema);
