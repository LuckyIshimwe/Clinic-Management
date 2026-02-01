const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

dotenv.config();
connectDB();

const app = express();


app.use(cors());
app.use(express.json());


const UserRoutes = require('./routes/UserRoutes');
const PatientRoutes = require('./routes/PatientRoutes');
const ClinicRoutes = require('./routes/clinicRoutes');
// const ConsultationRoutes = require('./routes/ConsultationRoutes');
 const LabRequestRoutes = require('./routes/LabRequestRoutes');
// const HospitalizationRoutes = require('./routes/HospitalizationRoutes');
// const ReferralRoutes = require('./routes/ReferralRoutes');
 const MedicalHistoryRoutes = require('./routes/MedicalHistoryRoutes');
 const prescriptionRoutes = require('./routes/PrescriptionRoutes');
 const NotificationRoutes = require('./routes/NotificationRoutes');

// Route Middlewares
app.use('/api/user', UserRoutes);
app.use('/api/patient', PatientRoutes);
app.use('/api/clinic', ClinicRoutes);
// app.use('/api/consultation', ConsultationRoutes);
 app.use('/api/lab-request', LabRequestRoutes);
// app.use('/api/hospitalization', HospitalizationRoutes);
// app.use('/api/referral', ReferralRoutes);
app.use('/api/patient-history', MedicalHistoryRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/notifications', NotificationRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Clinic Management Backend is running...',
    endpoints: {
      users: '/api/user',
      patients: '/api/patient',
      // clinics: '/api/clinic',
      // consultations: '/api/consultation',
      // labRequests: '/api/lab-request',
      // hospitalizations: '/api/hospitalization',
      // referrals: '/api/referral',
      // patientHistory: '/api/patient-history'
    }
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});


app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));