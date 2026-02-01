const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  
  
  clinicId: {
    type: mongoose.Schema.Types.Mixed, 
    required: true,
    index: true
  },
  
 
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  
  doctorId: {
    type: String
  },
  
  doctorName: {
    type: String
  },
  
  
  medicines: [{
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    dosage: { 
      type: String, 
      required: true,
      trim: true
    },
    frequency: { 
      type: String, 
      required: true,
      trim: true
    },
    duration: { 
      type: String, 
      required: true,
      trim: true
    },
    instructions: {
      type: String,
      trim: true
    }
  }],
  
  
  notes: {
    type: String,
    trim: true
  },
  
  
  status: {
    type: String,
    enum: ['Active', 'Dispensed', 'Completed', 'Cancelled'],
    default: 'Active',
    index: true
  },
  
  
  dispensedBy: {
    type: String
  },
  
  dispensedDate: {
    type: Date
  },
  
 
  completedDate: {
    type: Date
  }
}, {
  timestamps: true 
});


prescriptionSchema.index({ clinicId: 1, status: 1, createdAt: -1 });
prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ clinicId: 1, createdAt: -1 });


prescriptionSchema.virtual('medicineCount').get(function() {
  return this.medicines ? this.medicines.length : 0;
});


prescriptionSchema.methods.isActive = function() {
  return this.status === 'Active';
};


prescriptionSchema.statics.getActivePrescriptions = function(clinicId) {
  return this.find({
    clinicId,
    status: 'Active'
  })
    .populate('patientId', 'fullName patientId age gender phone')
    .populate('prescribedBy', 'name staffId')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Prescription', prescriptionSchema);