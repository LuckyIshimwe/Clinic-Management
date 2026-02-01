const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    ref: 'Patient'
  },
  diagnosis: {
    type: String,
    required: true
  },
  symptoms: {
    type: String,
    default: ''
  },
  treatment: {
    type: String,
    required: true
  },
  vitals: {
    bloodPressure: String,
    temperature: String,
    heartRate: String,
    weight: String,
    height: String,
    oxygenSaturation: String
  },
  notes: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requiresDoctorAttention: {
    type: Boolean,
    default: false
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  }
}, {
  timestamps: true
});


medicalHistorySchema.index({ patientId: 1, createdAt: -1 });
medicalHistorySchema.index({ requiresDoctorAttention: 1, severity: 1 });

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);