const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['patient_attention', 'lab_result', 'general'],
    default: 'general'
  },
  patientId: {
    type: String,
    ref: 'Student'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  schoolId: {
    type: String,
    default: 'SCHOOL001'
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ patientId: 1 });
notificationSchema.index({ schoolId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);