const mongoose = require('mongoose');

const healthVisitSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    ref: 'Student'
  },
  visitNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  chiefComplaint: {
    type: String,
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  vitals: {
    temperature: String,
    bloodPressure: String,
    heartRate: String,
    weight: String,
    height: String,
    oxygenSaturation: String
  },
  nurseAssessment: {
    type: String,
    default: ''
  },
  nurseNotes: {
    type: String,
    default: ''
  },
  
  status: {
    type: String,
    enum: ['pending', 'nurse_treated', 'lab_pending', 'lab_completed', 'doctor_review', 'completed', 'referred'],
    default: 'pending'
  },
  
  nurseTreated: {
    type: Boolean,
    default: false
  },
  nurseTreatment: {
    medicationGiven: String,
    dosage: String,
    instructions: String,
    treatmentNotes: String,
    treatedAt: Date
  },
  
  requiresLab: {
    type: Boolean,
    default: false
  },
  labRequest: {
    testType: String,
    testDetails: String,
    urgency: {
      type: String,
      enum: ['Normal', 'Urgent', 'Emergency'],
      default: 'Normal'
    },
    requestedAt: Date,
    completedAt: Date
  },
 
  labResults: {
    results: String,
    findings: String,
    interpretation: String,
    recommendedActions: String,
    abnormalFindings: Boolean,
    criticalValues: Boolean,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  requiresDoctorReview: {
    type: Boolean,
    default: false
  },
  doctorDiagnosis: {
    type: String,
    default: ''
  },
  doctorTreatment: {
    type: String,
    default: ''
  },
  doctorNotes: {
    type: String,
    default: ''
  },
  prescription: {
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    notes: String
  },
  
  referred: {
    type: Boolean,
    default: false
  },
  referralDetails: {
    referredTo: String,
    reason: String,
    referredAt: Date
  },
  
  hospitalized: {
    type: Boolean,
    default: false
  },
  hospitalizationDetails: {
    hospital: String,
    reason: String,
    admittedAt: Date
  },
  
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String,
 
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  
  attendedBy: {
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    labTech: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  schoolId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});


healthVisitSchema.index({ studentId: 1, createdAt: -1 });
healthVisitSchema.index({ schoolId: 1, status: 1 });
healthVisitSchema.index({ requiresDoctorReview: 1, status: 1 });



healthVisitSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('HealthVisit').countDocuments({ schoolId: this.schoolId });
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.visitNumber = `V${year}${month}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('HealthVisit', healthVisitSchema);