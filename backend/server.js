const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');


dotenv.config();


const app = express();


connectDB();


const corsOptions = {
  origin: [
    'https://clinic-system-rust.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UserRoutes = require('./routes/UserRoutes');
const studentRoutes = require('./routes/StudentRoutes');
const ClinicRoutes = require('./routes/clinicRoutes');
const LabRequestRoutes = require('./routes/LabRequestRoutes');
const MedicalHistoryRoutes = require('./routes/HealthVisitRoutes');
const prescriptionRoutes = require('./routes/PrescriptionRoutes');
const NotificationRoutes = require('./routes/NotificationRoutes');


app.use('/api/user', UserRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/clinic', ClinicRoutes);
app.use('/api/lab-request', LabRequestRoutes);
app.use('/api/health-visits', MedicalHistoryRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/notifications', NotificationRoutes);


app.get('/', (req, res) => {
  res.json({ 
    message: 'Clinic Management API is running',
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: '/api/user',
      students: '/api/student',
      clinics: '/api/clinic',
      labRequests: '/api/lab-request',
      studentHistory: '/api/student-history',
      prescriptions: '/api/prescription',
      notifications: '/api/notifications'
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

module.exports = app;