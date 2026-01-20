import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function NurseDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showLabRequestModal, setShowLabRequestModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [patientForm, setPatientForm] = useState({
    fullName: '',
    age: '',
    gender: '',
    address: '',
    phone: '',
    bloodGroup: 'Unknown',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    medicalHistory: '',
    allergies: ''
  });

  const [labRequestForm, setLabRequestForm] = useState({
    testType: '',
    testDetails: '',
    urgency: 'Normal'
  });

  const [vitalsForm, setVitalsForm] = useState({
    diagnosis: 'Vital Signs Check',
    symptoms: '',
    treatment: 'Routine monitoring',
    vitals: {
      bloodPressure: '',
      temperature: '',
      heartRate: '',
      weight: '',
      height: '',
      oxygenSaturation: ''
    },
    notes: ''
  });

  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('Auth check:', { hasUser: !!userStr, hasToken: !!token });
    
    if (!userStr || !token) {
      console.log('No auth found, redirecting to login');
      navigate('/');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      console.log('User data:', userData);
      
      if (userData.role !== 'nurse') {
        console.log('User is not a nurse, redirecting');
        navigate('/');
        return;
      }

      setUser(userData);
      fetchPatients();
      fetchLabRequests();
    } catch (err) {
      console.error('Error parsing user data:', err);
      navigate('/');
    }
  }, [navigate]);

  const fetchPatients = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      console.log('Fetching patients from:', `${baseURL}/patient/get`);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const res = await axios.get(`${baseURL}/patient/get`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Patients response:', res.data);
      
      if (Array.isArray(res.data)) {
        setPatients(res.data);
      } else if (res.data.patients && Array.isArray(res.data.patients)) {
        setPatients(res.data.patients);
      } else {
        console.error('Unexpected response format:', res.data);
        setError('Unexpected data format received from server');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching patients:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } else {
        setError(`Failed to load patients: ${err.response?.data?.message || err.message}`);
      }
      setLoading(false);
    }
  };

  const fetchLabRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching lab requests from:', `${baseURL}/lab-request/`);
      
      const res = await axios.get(`${baseURL}/lab-request/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Lab requests response:', res.data);
      setLabRequests(res.data.requests || res.data || []);
    } catch (err) {
      console.error('Error fetching lab requests:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching patient history for:', patientId);
      
      const historyRes = await axios.get(`${baseURL}/patient-history/${patientId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Patient history response:', historyRes.data);
      setMedicalHistory(historyRes.data || []);
    } catch (err) {
      console.error('Error fetching patient details:', {
        message: err.message,
        response: err.response?.data
      });
      setMedicalHistory([]);
    }
  };

  const handlePatientSelect = (patient) => {
    console.log('Selected patient:', patient);
    setSelectedPatient(patient);
    fetchPatientDetails(patient.patientId);
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Registering patient:', patientForm);
      
      const response = await axios.post(`${baseURL}/patient/`, patientForm, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Patient registered:', response.data);
      alert('Patient registered successfully: ' + response.data.patient.patientId);
      
      setShowPatientModal(false);
      setPatientForm({
        fullName: '',
        age: '',
        gender: 'Male',
        address: '',
        phone: '',
        bloodGroup: 'Unknown',
        emergencyContact: { name: '', relationship: '', phone: '' },
        medicalHistory: '',
        allergies: ''
      });
      
      await fetchPatients();
    } catch (err) {
      console.error('Error registering patient:', {
        message: err.message,
        response: err.response?.data
      });
      alert('Error registering patient: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleLabRequest = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Creating lab request:', {
        patientId: selectedPatient.patientId,
        ...labRequestForm
      });
      
      const response = await axios.post(`${baseURL}/lab-request/`, {
        patientId: selectedPatient.patientId,
        ...labRequestForm
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Lab request created:', response.data);
      alert('Lab request created successfully');
      
      setShowLabRequestModal(false);
      setLabRequestForm({ testType: '', testDetails: '', urgency: 'Normal' });
      await fetchLabRequests();
    } catch (err) {
      console.error('Error creating lab request:', {
        message: err.message,
        response: err.response?.data
      });
      alert('Error creating lab request: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRecordVitals = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Recording vitals:', {
        patientId: selectedPatient.patientId,
        ...vitalsForm
      });
      
      const response = await axios.post(`${baseURL}/patient-history/`, {
        patientId: selectedPatient.patientId,
        ...vitalsForm
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Vitals recorded:', response.data);
      alert('Vitals recorded successfully');
      
      setShowVitalsModal(false);
      setVitalsForm({
        diagnosis: 'Vital Signs Check',
        symptoms: '',
        treatment: 'Routine monitoring',
        vitals: {
          bloodPressure: '',
          temperature: '',
          heartRate: '',
          weight: '',
          height: '',
          oxygenSaturation: ''
        },
        notes: ''
      });
      
      await fetchPatientDetails(selectedPatient.patientId);
    } catch (err) {
      console.error('Error recording vitals:', {
        message: err.message,
        response: err.response?.data
      });
      alert('Error recording vitals: ' + (err.response?.data?.message || err.message));
    }
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Poppins']">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-green-600 p-2.5 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 16.93c-3.95-.49-7-3.85-7-7.84V6.3l6-2.25v14.88z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Nurse Dashboard</h1>
              <p className="text-xs text-gray-600">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPatients}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Refresh
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
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setShowPatientModal(true)}
            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">Register Patient</h3>
                <p className="text-xs text-gray-600">Add new patient</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => selectedPatient && setShowVitalsModal(true)}
            disabled={!selectedPatient}
            className={`bg-white p-4 rounded-2xl shadow-sm transition-all ${
              selectedPatient ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">Record Vitals</h3>
                <p className="text-xs text-gray-600">Track patient vitals</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => selectedPatient && setShowLabRequestModal(true)}
            disabled={!selectedPatient}
            className={`bg-white p-4 rounded-2xl shadow-sm transition-all ${
              selectedPatient ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">Lab Request</h3>
                <p className="text-xs text-gray-600">Request lab tests</p>
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Patients List */}
          <div className="col-span-4 bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Patients ({patients.length})</h2>
              <span className="text-xs text-gray-500">Total registered</span>
            </div>
            
            {patients.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm text-gray-500">No patients registered yet</p>
                <p className="text-xs text-gray-400 mt-1">Click "Register Patient" to add one</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
                {patients.map((patient) => (
                  <button
                    key={patient._id}
                    onClick={() => handlePatientSelect(patient)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedPatient?._id === patient._id
                        ? 'bg-green-50 border-2 border-green-200'
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
            )}
          </div>

          
          <div className="col-span-8">
            {selectedPatient ? (
              <div className="space-y-6">
               
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">{selectedPatient.fullName}</h2>
                  
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

                  <div className="bg-gray-50 p-4 rounded-xl mb-4">
                    <p className="text-xs text-gray-600 mb-2">Medical History</p>
                    <p className="text-sm text-gray-800">{selectedPatient.medicalHistory || 'No medical history recorded'}</p>
                  </div>

                  {selectedPatient.allergies && (
                    <div className="bg-red-50 p-4 rounded-xl">
                      <p className="text-xs text-red-600 font-medium mb-2">Allergies</p>
                      <p className="text-sm text-red-800">{selectedPatient.allergies}</p>
                    </div>
                  )}
                </div>

             
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Recent Medical History</h3>
                  <div className="space-y-3">
                    {medicalHistory.length > 0 ? (
                      medicalHistory.slice(0, 5).map((record) => (
                        <div key={record._id} className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm text-gray-800">{record.diagnosis}</h4>
                            <span className="text-xs text-gray-500">
                              {new Date(record.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {record.vitals && (
                            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                              {record.vitals.bloodPressure && (
                                <div>BP: {record.vitals.bloodPressure}</div>
                              )}
                              {record.vitals.temperature && (
                                <div>Temp: {record.vitals.temperature}</div>
                              )}
                              {record.vitals.heartRate && (
                                <div>HR: {record.vitals.heartRate}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No medical history available</p>
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

      
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Lab Requests</h2>
          {labRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No lab requests yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {labRequests.slice(0, 6).map((request) => (
                <div key={request._id} className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-800">{request.testType}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-md ${
                      request.status === 'completed' ? 'bg-green-100 text-green-700' :
                      request.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Patient ID: {request.patientId}</p>
                  <p className="text-xs text-gray-500 mt-1">{request.urgency} priority</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

     
      {showPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Register New Patient</h2>
            </div>
            <form onSubmit={handleRegisterPatient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.fullName}
                    onChange={(e) => setPatientForm({...patientForm, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    value={patientForm.age}
                    onChange={(e) => setPatientForm({...patientForm, age: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    required
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={patientForm.bloodGroup}
                    onChange={(e) => setPatientForm({...patientForm, bloodGroup: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={patientForm.phone}
                  onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <textarea
                  required
                  value={patientForm.address}
                  onChange={(e) => setPatientForm({...patientForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                <textarea
                  value={patientForm.medicalHistory}
                  onChange={(e) => setPatientForm({...patientForm, medicalHistory: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                <input
                  type="text"
                  value={patientForm.allergies}
                  onChange={(e) => setPatientForm({...patientForm, allergies: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={patientForm.emergencyContact.name}
                    onChange={(e) => setPatientForm({
                      ...patientForm,
                      emergencyContact: {...patientForm.emergencyContact, name: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={patientForm.emergencyContact.relationship}
                    onChange={(e) => setPatientForm({
                      ...patientForm,
                      emergencyContact: {...patientForm.emergencyContact, relationship: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={patientForm.emergencyContact.phone}
                    onChange={(e) => setPatientForm({
                      ...patientForm,
                      emergencyContact: {...patientForm.emergencyContact, phone: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lab Request Modal */}
      {showLabRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Request Lab Test</h2>
            </div>
            <form onSubmit={handleLabRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Type *</label>
                <select
                  required
                  value={labRequestForm.testType}
                  onChange={(e) => setLabRequestForm({...labRequestForm, testType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Select test type</option>
                  <option value="Blood Test">Blood Test</option>
                  <option value="Urine Test">Urine Test</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="MRI">MRI</option>
                  <option value="Ultrasound">Ultrasound</option>
                  <option value="ECG">ECG</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Details</label>
                <textarea
                  value={labRequestForm.testDetails}
                  onChange={(e) => setLabRequestForm({...labRequestForm, testDetails: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  rows={3}
                  placeholder="Additional details about the test..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency *</label>
                <select
                  required
                  value={labRequestForm.urgency}
                  onChange={(e) => setLabRequestForm({...labRequestForm, urgency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLabRequestModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Vitals Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Record Patient Vitals</h2>
            </div>
            <form onSubmit={handleRecordVitals} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={vitalsForm.vitals.bloodPressure}
                    onChange={(e) => setVitalsForm({
                      ...vitalsForm,
                      vitals: {...vitalsForm.vitals, bloodPressure: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <input
                    type="text"
                    placeholder="98.6°F"
                    value={vitalsForm.vitals.temperature}
                    onChange={(e) => setVitalsForm({
                      ...vitalsForm,
                      vitals: {...vitalsForm.vitals, temperature: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate</label>
                  <input
                    type="text"
                    placeholder="72 bpm"
                    value={vitalsForm.vitals.heartRate}
                    onChange={(e) => setVitalsForm({
                      ...vitalsForm,
                      vitals: {...vitalsForm.vitals, heartRate: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">O2 Saturation</label>
                  <input
                    type="text"
                    placeholder="98%"
                    value={vitalsForm.vitals.oxygenSaturation}
                    onChange={(e) => setVitalsForm({
                      ...vitalsForm,
                      vitals: {...vitalsForm.vitals, oxygenSaturation: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <input
                    type="text"
                    placeholder="70 kg"
                    value={vitalsForm.vitals.weight}
                    onChange={(e) => setVitalsForm({
                      ...vitalsForm,
                      vitals: {...vitalsForm.vitals, weight: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <input
                    type="text"
                    placeholder="170 cm"
                    value={vitalsForm.vitals.height}
                    onChange={(e) => setVitalsForm({
                      ...vitalsForm,
                      vitals: {...vitalsForm.vitals, height: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                <textarea
                  value={vitalsForm.symptoms}
                  onChange={(e) => setVitalsForm({...vitalsForm, symptoms: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  rows={2}
                  placeholder="Patient complaints or observations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={vitalsForm.notes}
                  onChange={(e) => setVitalsForm({...vitalsForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  rows={2}
                  placeholder="Additional observations..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}