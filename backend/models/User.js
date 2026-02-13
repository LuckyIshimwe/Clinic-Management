const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  staffId: { 
    type: String, 
    required: true,
    unique: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'doctor', 'nurse', 'lab_technician'], 
    required: true 
  },
  schoolId: {
    type: String,
    required: true
  },
  specialization: String,
  phone: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
userSchema.index({ schoolId: 1, role: 1 });
// userSchema.index({ staffId: 1 });

module.exports = mongoose.model('User', userSchema);