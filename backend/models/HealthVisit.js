const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
  temperature: {
    type: Number,
    min: 34,
    max: 45,
    default: null
  },
  bloodPressure: {
    type: String,
    default: null
  },
  heartRate: {
    type: Number,
    min: 30,
    max: 200,
    default: null
  },
  weight: {
    type: Number,
    min: 0,
    default: null
  },
  height: {
    type: Number,
    min: 0,
    default: null
  },
  oxygenSaturation: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  }
}, { _id: false });

const nurseTreatmentSchema = new mongoose.Schema({
  medicationGiven: String,
  dosage: String,
  instructions: String,
  treatmentNotes: String,
  treatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const labRequestSchema = new mongoose.Schema({
  testType: {
    type: String,
    required: true
  },
  testDetails: String,
  urgency: {
    type: String,
    enum: ['Normal', 'Urgent', 'Emergency'],
    default: 'Normal'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, { _id: false });

const labResultsSchema = new mongoose.Schema({
  results: String,
  findings: String,
  interpretation: String,
  recommendedActions: String,
  abnormalFindings: {
    type: Boolean,
    default: false
  },
  criticalValues: {
    type: Boolean,
    default: false
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  instructions: String
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  medicines: [medicineSchema],
  notes: String
}, { _id: false });

const referralDetailsSchema = new mongoose.Schema({
  referredTo: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  referredAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const hospitalizationDetailsSchema = new mongoose.Schema({
  hospital: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  admittedAt: {
    type: Date,
    default: Date.now
  },
  dischargedAt: Date
}, { _id: false });

const attendedBySchema = new mongoose.Schema({
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
}, { _id: false });

const healthVisitSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    ref: 'Student'
  },
  
  visitNumber: {
    type: String,
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
  
  vitals: vitalsSchema,
  
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
    enum: ['pending', 'nurse_treated', 'lab_pending', 'lab_completed', 'doctor_review', 'completed', 'referred', 'hospitalized'],
    default: 'pending'
  },
  
  nurseTreated: {
    type: Boolean,
    default: false
  },
  
  nurseTreatment: nurseTreatmentSchema,
  
  requiresLab: {
    type: Boolean,
    default: false
  },
  
  labRequest: labRequestSchema,
  
  labResults: labResultsSchema,
  
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
  
  prescription: prescriptionSchema,
  
  referred: {
    type: Boolean,
    default: false
  },
  
  referralDetails: referralDetailsSchema,
  
  hospitalized: {
    type: Boolean,
    default: false
  },
  
  hospitalizationDetails: hospitalizationDetailsSchema,
  
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
  
  attendedBy: attendedBySchema,
  
  schoolId: {
    type: String,  
    required: true,
    ref: 'School'
  }
}, {
  timestamps: true
});


healthVisitSchema.index({ studentId: 1, createdAt: -1 });
healthVisitSchema.index({ schoolId: 1, status: 1 });
healthVisitSchema.index({ schoolId: 1, requiresDoctorReview: 1, status: 1 });


healthVisitSchema.pre('save', async function() {
  
  if (this.isNew && !this.visitNumber) {
    
    let Counter;
    try {
      Counter = mongoose.model('Counter');
    } catch (error) {
     
      const counterSchema = new mongoose.Schema({
        _id: String,
        sequence_value: { type: Number, default: 0 }
      });
      Counter = mongoose.model('Counter', counterSchema);
    }
    
    
    const counter = await Counter.findByIdAndUpdate(
      `healthvisit_${this.schoolId}`,
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    
    
    const count = counter.sequence_value;
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    this.visitNumber = `V${year}${month}${String(count).padStart(5, '0')}`;
    
    console.log('✅ Generated visitNumber:', this.visitNumber);
  }
});

module.exports = mongoose.model('HealthVisit', healthVisitSchema);