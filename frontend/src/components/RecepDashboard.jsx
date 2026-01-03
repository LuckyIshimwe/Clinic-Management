import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  const [patientForm, setPatientForm] = useState({
    fullName: '',
    age: '',
    gender: 'Male',
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

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      navigate('/');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'receptionist') {
      navigate('/');
      return;
    }

    setUser(userData);
    fetchPatients();
  }, [navigate]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/patient`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Patients fetched:', res.data);
      setPatients(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching patients:', err);
      alert('Error loading patients: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${baseURL}/patient`, patientForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Patient registered:', response.data);
      alert(`Patient registered successfully!\nPatient ID: ${response.data.patient.patientId}`);
      
      setShowPatientModal(false);
      resetForm();
      
      await fetchPatients();
      setLoading(false);
      
    } catch (err) {
      console.error('Error registering patient:', err);
      alert('Error registering patient: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${baseURL}/patient/${selectedPatient.patientId}`, patientForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Patient updated:', response.data);
      alert('Patient information updated successfully!');
      
      setShowEditModal(false);
      setSelectedPatient(null);
      
      await fetchPatients();
      setLoading(false);
      
    } catch (err) {
      console.error('Error updating patient:', err);
      alert('Error updating patient: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const handleEditClick = (patient) => {
    setSelectedPatient(patient);
    setPatientForm({
      fullName: patient.fullName,
      age: patient.age,
      gender: patient.gender,
      address: patient.address,
      phone: patient.phone,
      bloodGroup: patient.bloodGroup || 'Unknown',
      emergencyContact: patient.emergencyContact || { name: '', relationship: '', phone: '' },
      medicalHistory: patient.medicalHistory || '',
      allergies: patient.allergies || ''
    });
    setShowEditModal(true);
  };

  const handleViewClick = (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
  };

  const resetForm = () => {
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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery);

    const matchesFilter = 
      filterStatus === 'All' ? true :
      filterStatus === 'Active' ? patient.status === 'Active' && !patient.hospitalized :
      filterStatus === 'Hospitalized' ? patient.hospitalized :
      filterStatus === 'Referred' ? patient.status === 'Referred' :
      true;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'Active' && !p.hospitalized).length,
    hospitalized: patients.filter(p => p.hospitalized).length,
    referred: patients.filter(p => p.status === 'Referred').length
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 font-['Poppins']">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Poppins']">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-2.5 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Receptionist Dashboard</h1>
              <p className="text-xs text-gray-600">Welcome back, {user?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-xs text-gray-600 mt-1">Total Patients</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
                <p className="text-xs text-gray-600 mt-1">Active Patients</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.hospitalized}</p>
                <p className="text-xs text-gray-600 mt-1">Hospitalized</p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.referred}</p>
                <p className="text-xs text-gray-600 mt-1">Referred</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, patient ID, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="flex gap-2">
              {['All', 'Active', 'Hospitalized', 'Referred'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                resetForm();
                setShowPatientModal(true);
              }}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register Patient
            </button>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Patient ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Age / Gender</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Blood Group</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-800">{patient.patientId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="bg-orange-100 rounded-full p-2 mr-3">
                          <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-800">{patient.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{patient.age} yrs / {patient.gender}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{patient.phone}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">
                        {patient.bloodGroup}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <span className={`px-2 py-1 text-xs rounded-md font-medium ${
                          patient.status === 'Active' && !patient.hospitalized ? 'bg-green-100 text-green-700' :
                          patient.status === 'Discharged' ? 'bg-gray-100 text-gray-700' :
                          patient.status === 'Referred' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {patient.hospitalized ? 'Hospitalized' : patient.status}
                        </span>
                        {patient.allergies && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md font-medium">
                            Allergies
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewClick(patient)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditClick(patient)}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 text-sm">
                {searchQuery || filterStatus !== 'All' ? 'No patients match your search criteria' : 'No patients registered yet'}
              </p>
            </div>
          )}

          {filteredPatients.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-800">{filteredPatients.length}</span> of <span className="font-semibold text-gray-800">{patients.length}</span> patients
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Register Patient Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Register New Patient</h2>
                <button
                  onClick={() => setShowPatientModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleRegisterPatient} className="p-6 space-y-5">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={patientForm.fullName}
                      onChange={(e) => setPatientForm({...patientForm, fullName: e.target.value})}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Age *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="150"
                      value={patientForm.age}
                      onChange={(e) => setPatientForm({...patientForm, age: e.target.value})}
                      placeholder="45"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
                    <select
                      required
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group</label>
                    <select
                      value={patientForm.bloodGroup}
                      onChange={(e) => setPatientForm({...patientForm, bloodGroup: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={patientForm.phone}
                      onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                      placeholder="+250788123456"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Contact Information
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address *</label>
                  <textarea
                    required
                    value={patientForm.address}
                    onChange={(e) => setPatientForm({...patientForm, address: e.target.value})}
                    placeholder="123 Main Street, Kigali, Rwanda"
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Medical Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Medical History</label>
                    <textarea
                      value={patientForm.medicalHistory}
                      onChange={(e) => setPatientForm({...patientForm, medicalHistory: e.target.value})}
                      placeholder="Previous illnesses, chronic conditions, surgeries, etc."
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Allergies</label>
                    <input
                      type="text"
                      value={patientForm.allergies}
                      onChange={(e) => setPatientForm({...patientForm, allergies: e.target.value})}
                      placeholder="Penicillin, Peanuts, etc. (or 'None')"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Emergency Contact (Optional)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={patientForm.emergencyContact.name}
                      onChange={(e) => setPatientForm({
                        ...patientForm,
                        emergencyContact: {...patientForm.emergencyContact, name: e.target.value}
                      })}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
                    <input
                      type="text"
                      value={patientForm.emergencyContact.relationship}
                      onChange={(e) => setPatientForm({
                        ...patientForm,
                        emergencyContact: {...patientForm.emergencyContact, relationship: e.target.value}
                      })}
                      placeholder="Wife, Brother, etc."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={patientForm.emergencyContact.phone}
                      onChange={(e) => setPatientForm({
                        ...patientForm,
                        emergencyContact: {...patientForm.emergencyContact, phone: e.target.value}
                      })}
                      placeholder="+250788654321"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Edit Patient Information</h2>
                  <p className="text-sm text-gray-600 mt-1">Patient ID: {selectedPatient?.patientId}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdatePatient} className="p-6 space-y-5">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={patientForm.fullName}
                      onChange={(e) => setPatientForm({...patientForm, fullName: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Age *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="150"
                      value={patientForm.age}
                      onChange={(e) => setPatientForm({...patientForm, age: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
                    <select
                      required
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group</label>
                    <select
                      value={patientForm.bloodGroup}
                      onChange={(e) => setPatientForm({...patientForm, bloodGroup: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={patientForm.phone}
                      onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Contact Information
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address *</label>
                  <textarea
                    required
                    value={patientForm.address}
                    onChange={(e) => setPatientForm({...patientForm, address: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                  />
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Medical Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Medical History</label>
                    <textarea
                      value={patientForm.medicalHistory}
                      onChange={(e) => setPatientForm({...patientForm, medicalHistory: e.target.value})}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Allergies</label>
                    <input
                      type="text"
                      value={patientForm.allergies}
                      onChange={(e) => setPatientForm({...patientForm, allergies: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={patientForm.emergencyContact.name}
                      onChange={(e) => setPatientForm({
                        ...patientForm,
                        emergencyContact: {...patientForm.emergencyContact, name: e.target.value}
                      })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
                    <input
                      type="text"
                      value={patientForm.emergencyContact.relationship}
                      onChange={(e) => setPatientForm({
                        ...patientForm,
                        emergencyContact: {...patientForm.emergencyContact, relationship: e.target.value}
                      })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={patientForm.emergencyContact.phone}
                      onChange={(e) => setPatientForm({
                        ...patientForm,
                        emergencyContact: {...patientForm.emergencyContact, phone: e.target.value}
                      })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Patient Modal */}
      {showViewModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Patient Details</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedPatient.patientId}</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Full Name</p>
                    <p className="text-sm font-medium text-gray-800">{selectedPatient.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Age / Gender</p>
                    <p className="text-sm font-medium text-gray-800">{selectedPatient.age} years / {selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Blood Group</p>
                    <p className="text-sm font-medium text-gray-800">{selectedPatient.bloodGroup}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-md font-medium ${
                      selectedPatient.hospitalized ? 'bg-red-100 text-red-700' :
                      selectedPatient.status === 'Referred' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {selectedPatient.hospitalized ? 'Hospitalized' : selectedPatient.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Phone Number</p>
                    <p className="text-sm font-medium text-gray-800">{selectedPatient.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Address</p>
                    <p className="text-sm text-gray-800">{selectedPatient.address}</p>
                  </div>
                </div>
              </div>

              {/* Medical Info */}
              {(selectedPatient.medicalHistory || selectedPatient.allergies) && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Medical Information
                  </h3>
                  <div className="space-y-3">
                    {selectedPatient.medicalHistory && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Medical History</p>
                        <p className="text-sm text-gray-800">{selectedPatient.medicalHistory}</p>
                      </div>
                    )}
                    {selectedPatient.allergies && (
                      <div>
                        <p className="text-xs text-red-600 font-medium mb-1">⚠️ Allergies</p>
                        <p className="text-sm text-red-800 font-medium">{selectedPatient.allergies}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {selectedPatient.emergencyContact?.name && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Name</p>
                      <p className="text-sm font-medium text-gray-800">{selectedPatient.emergencyContact.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Relationship</p>
                      <p className="text-sm font-medium text-gray-800">{selectedPatient.emergencyContact.relationship}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Phone</p>
                      <p className="text-sm font-medium text-gray-800">{selectedPatient.emergencyContact.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {(selectedPatient.hospitalized || selectedPatient.referredTo) && (
                <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-3">Additional Status Information</h3>
                  <div className="space-y-2">
                    {selectedPatient.hospitalized && (
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">Hospitalized:</span> Since {new Date(selectedPatient.hospitalizedDate || selectedPatient.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                    {selectedPatient.referredTo && (
                      <div>
                        <p className="text-sm text-yellow-800">
                          <span className="font-medium">Referred To:</span> {selectedPatient.referredTo}
                        </p>
                        {selectedPatient.referralReason && (
                          <p className="text-sm text-yellow-800 mt-1">
                            <span className="font-medium">Reason:</span> {selectedPatient.referralReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <p className="mb-1">Registered On</p>
                    <p className="text-gray-800">{new Date(selectedPatient.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="mb-1">Last Updated</p>
                    <p className="text-gray-800">{new Date(selectedPatient.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditClick(selectedPatient);
                  }}
                  className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
                >
                  Edit Patient
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}