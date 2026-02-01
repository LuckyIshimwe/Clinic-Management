import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showHospitalizeModal, setShowHospitalizeModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [consultationForm, setConsultationForm] = useState({
    diagnosis: '',
    symptoms: '',
    treatment: '',
    vitals: {
      bloodPressure: '',
      temperature: '',
      heartRate: '',
      weight: '',
      height: '',
      oxygenSaturation: ''
    },
    notes: '',
    followUpDate: ''
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    notes: ''
  });

  const [referralForm, setReferralForm] = useState({
    referredTo: '',
    referralReason: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      navigate('/');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'doctor') {
      navigate('/');
      return;
    }

    setUser(userData);
    fetchPatients();
    fetchNotifications();
    
   
    const notificationInterval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(notificationInterval);
  }, [navigate]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/patient/get`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Notifications response:', res.data);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${baseURL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? { ...notif, isRead: true } : notif
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${baseURL}/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    
    if (!notification.isRead) {
      await markNotificationAsRead(notification._id);
    }
    
    
    if (notification.patientId) {
      const patient = patients.find(p => p.patientId === notification.patientId);
      if (patient) {
        setSelectedPatient(patient);
        fetchPatientDetails(patient.patientId);
        setShowNotificationsModal(false);
      }
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      const [historyRes, prescRes] = await Promise.all([
        axios.get(`${baseURL}/patient-history/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${baseURL}/prescription/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setMedicalHistory(historyRes.data);
      setPrescriptions(prescRes.data);
    } catch (err) {
      console.error('Error fetching patient details:', err);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    console.log('Selected patient:', patient);
    fetchPatientDetails(patient.patientId);
  };

  const handleConsultation = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${baseURL}/patient-history/`, {
        patientId: selectedPatient.patientId,
        ...consultationForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Consultation recorded:', response.data);
      alert('Consultation recorded successfully');

      setShowConsultationModal(false);
      setConsultationForm({
        diagnosis: '',
        symptoms: '',
        treatment: '',
        vitals: {
          bloodPressure: '',
          temperature: '',
          heartRate: '',
          weight: '',
          height: '',
          oxygenSaturation: ''
        },
        notes: '',
        followUpDate: ''
      });

      await fetchPatientDetails(selectedPatient.patientId);
    } catch (err) {
      console.error('Error recording consultation:', err);
      alert('Error recording consultation: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePrescription = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${baseURL}/prescription/`, {
        patientId: selectedPatient._id,
        ...prescriptionForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Prescription created:', response.data);
      alert('Prescription created successfully');

      setShowPrescriptionModal(false);
      setPrescriptionForm({
        medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        notes: ''
      });

      await fetchPatientDetails(selectedPatient.patientId);
    } catch (err) {
      console.error('Error creating prescription:', err);
      alert('Error creating prescription: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleHospitalize = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${baseURL}/patient/${selectedPatient.patientId}/hospitalize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Patient hospitalized:', response.data);
      alert('Patient hospitalized successfully');

      setShowHospitalizeModal(false);
      await fetchPatients();
      
      if (selectedPatient) {
        const updatedPatient = patients.find(p => p.patientId === selectedPatient.patientId);
        if (updatedPatient) {
          setSelectedPatient({ ...updatedPatient, hospitalized: true });
        }
      }
    } catch (err) {
      console.error('Error hospitalizing patient:', err);
      alert('Error hospitalizing patient: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReferral = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${baseURL}/patient/${selectedPatient.patientId}/refer`, referralForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Patient referred:', response.data);
      alert('Referral sent successfully');

      setShowReferralModal(false);
      setReferralForm({ referredTo: '', referralReason: '' });

      await fetchPatients();
    } catch (err) {
      console.error('Error sending referral:', err);
      alert('Error sending referral: ' + (err.response?.data?.message || err.message));
    }
  };

  const addMedicine = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: [...prescriptionForm.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedicine = (index) => {
    const newMedicines = prescriptionForm.medicines.filter((_, i) => i !== index);
    setPrescriptionForm({ ...prescriptionForm, medicines: newMedicines });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 font-['Poppins']">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Poppins']">
     
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-teal-600 p-2.5 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Doctor Dashboard</h1>
              <p className="text-xs text-gray-600">Welcome back, Dr. {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            
            <button
              onClick={() => setShowNotificationsModal(true)}
              className="relative px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          <div className="col-span-4 bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Patients</h2>
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {patients.map((patient) => (
                <button
                  key={patient._id}
                  onClick={() => handlePatientSelect(patient)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${selectedPatient?._id === patient._id
                      ? 'bg-teal-50 border-2 border-teal-200'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-800">{patient.fullName}</span>
                    {patient.hospitalized && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-md">Hospitalized</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{patient.patientId}</p>
                  <p className="text-xs text-gray-500 mt-1">{patient.age} yrs • {patient.gender}</p>
                </button>
              ))}
            </div>
          </div>

          
          <div className="col-span-8">
            {selectedPatient ? (
              <div className="space-y-6">
                
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">{selectedPatient.fullName}</h2>
                      <p className="text-sm text-gray-600">{selectedPatient.patientId}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowConsultationModal(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        New Consultation
                      </button>
                      <button
                        onClick={() => setShowPrescriptionModal(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        Prescribe
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Age</p>
                      <p className="text-sm font-medium text-gray-800">{selectedPatient.age} years</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Gender</p>
                      <p className="text-sm font-medium text-gray-800">{selectedPatient.gender}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Blood Group</p>
                      <p className="text-sm font-medium text-gray-800">{selectedPatient.bloodGroup || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowHospitalizeModal(true)}
                      className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-medium transition-colors"
                    >
                      Hospitalize
                    </button>
                    <button
                      onClick={() => setShowReferralModal(true)}
                      className="flex-1 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-sm font-medium transition-colors"
                    >
                      Refer Patient
                    </button>
                  </div>
                </div>

               
                <div className="bg-white rounded-2xl shadow-sm">
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'history'
                          ? 'text-teal-600 border-b-2 border-teal-600'
                          : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      Medical History
                    </button>
                    <button
                      onClick={() => setActiveTab('prescriptions')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'prescriptions'
                          ? 'text-teal-600 border-b-2 border-teal-600'
                          : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      Prescriptions
                    </button>
                  </div>

                  <div className="p-6">
                    {activeTab === 'history' && (
                      <div className="space-y-4">
                        {medicalHistory.length > 0 ? (
                          medicalHistory.map((record) => (

                            <div key={record._id} className="bg-gray-50 p-4 rounded-xl">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-gray-800">{selectedPatient.medicalHistory}</h3>
                                    {record.requiresDoctorAttention && (
                                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-md">
                                        Requires Attention
                                      </span>
                                    )}
                                    {record.severity && (
                                      <span className={`px-2 py-0.5 text-xs rounded-md ${
                                        record.severity === 'high' ? 'bg-red-100 text-red-700' :
                                        record.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {record.severity}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(record.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              {record.symptoms && (
                                <p className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Symptoms:</span> {record.symptoms}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Treatment:</span> {record.treatment}
                              </p>
                              {record.notes && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Notes:</span> {record.notes}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-gray-500 py-8">No medical history available</p>
                        )}
                      </div>
                    )}

                    {activeTab === 'prescriptions' && (
                      <div className="space-y-4">
                        {prescriptions.length > 0 ? (
                          prescriptions.map((prescription) => (
                            <div key={prescription._id} className="bg-gray-50 p-4 rounded-xl">
                              <div className="flex items-start justify-between mb-3">
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md">
                                  {prescription.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(prescription.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {prescription.medicines.map((med, idx) => (
                                  <div key={idx} className="bg-white p-3 rounded-lg">
                                    <p className="font-medium text-sm text-gray-800">{med.name}</p>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {med.dosage} • {med.frequency} • {med.duration}
                                    </p>
                                    {med.instructions && (
                                      <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-gray-500 py-8">No prescriptions available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-gray-500">Select a patient to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="px-3 py-1.5 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg font-medium transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationsModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <button
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 rounded-xl transition-all ${
                        notification.isRead 
                          ? 'bg-gray-50 hover:bg-gray-100' 
                          : 'bg-teal-50 border-2 border-teal-200 hover:bg-teal-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm text-gray-800">{notification.title}</h3>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      {notification.patientId && (
                        <p className="text-xs text-teal-600 mt-2">
                          Click to view patient: {notification.patientId}
                        </p>
                      )}
                      {notification.severity && (
                        <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-md ${
                          notification.severity === 'high' ? 'bg-red-100 text-red-700' :
                          notification.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {notification.severity} severity
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      
      {showConsultationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">New Consultation</h2>
            </div>
            <form onSubmit={handleConsultation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={consultationForm.diagnosis}
                  onChange={(e) => setConsultationForm({ ...consultationForm, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                <textarea
                  value={consultationForm.symptoms}
                  onChange={(e) => setConsultationForm({ ...consultationForm, symptoms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment *</label>
                <textarea
                  required
                  value={consultationForm.treatment}
                  onChange={(e) => setConsultationForm({ ...consultationForm, treatment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={consultationForm.vitals.bloodPressure}
                    onChange={(e) => setConsultationForm({
                      ...consultationForm,
                      vitals: { ...consultationForm.vitals, bloodPressure: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <input
                    type="text"
                    placeholder="98.6°F"
                    value={consultationForm.vitals.temperature}
                    onChange={(e) => setConsultationForm({
                      ...consultationForm,
                      vitals: { ...consultationForm.vitals, temperature: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={consultationForm.notes}
                  onChange={(e) => setConsultationForm({ ...consultationForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConsultationModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors"
                >
                  Save Consultation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">New Prescription</h2>
            </div>
            <form onSubmit={handlePrescription} className="p-6 space-y-4">
              {prescriptionForm.medicines.map((med, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Medicine {idx + 1}</span>
                    {prescriptionForm.medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(idx)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Medicine name"
                    required
                    value={med.name}
                    onChange={(e) => {
                      const newMeds = [...prescriptionForm.medicines];
                      newMeds[idx].name = e.target.value;
                      setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Dosage"
                      required
                      value={med.dosage}
                      onChange={(e) => {
                        const newMeds = [...prescriptionForm.medicines];
                        newMeds[idx].dosage = e.target.value;
                        setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      required
                      value={med.frequency}
                      onChange={(e) => {
                        const newMeds = [...prescriptionForm.medicines];
                        newMeds[idx].frequency = e.target.value;
                        setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      required
                      value={med.duration}
                      onChange={(e) => {
                        const newMeds = [...prescriptionForm.medicines];
                        newMeds[idx].duration = e.target.value;
                        setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Instructions"
                    value={med.instructions}
                    onChange={(e) => {
                      const newMeds = [...prescriptionForm.medicines];
                      newMeds[idx].instructions = e.target.value;
                      setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addMedicine}
                className="w-full px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-medium transition-colors"
              >
                + Add Medicine
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={prescriptionForm.notes}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  Create Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     
      {showHospitalizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Hospitalize Patient</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to hospitalize {selectedPatient?.fullName}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHospitalizeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleHospitalize}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
              >
                Confirm Hospitalization
              </button>
            </div>
          </div>
        </div>
      )}

      
      {showReferralModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Refer Patient</h2>
            </div>
            <form onSubmit={handleReferral} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referred To *</label>
                <input
                  type="text"
                  required
                  value={referralForm.referredTo}
                  onChange={(e) => setReferralForm({ ...referralForm, referredTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  placeholder="Specialist name or hospital"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Referral *</label>
                <textarea
                  required
                  value={referralForm.referralReason}
                  onChange={(e) => setReferralForm({ ...referralForm, referralReason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  rows={4}
                  placeholder="Detailed reason for referral..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReferralModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors"
                >
                  Send Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}