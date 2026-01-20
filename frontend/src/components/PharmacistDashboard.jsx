import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function PharmacistDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active');
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      navigate('/');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (userData.role !== 'pharmacist') {
        navigate('/');
        return;
      }

      setUser(userData);
      fetchPrescriptions();
    } catch (err) {
      console.error('Error parsing user data:', err);
      navigate('/');
    }
  }, [navigate]);

  const fetchPrescriptions = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      const res = await axios.get(`${baseURL}/prescription/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Prescriptions response:', res.data);
      
      if (Array.isArray(res.data)) {
        setPrescriptions(res.data);
      } else if (res.data.prescriptions && Array.isArray(res.data.prescriptions)) {
        setPrescriptions(res.data.prescriptions);
      } else {
        console.error('Unexpected response format:', res.data);
        setPrescriptions([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      
      if (err.response?.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } else {
        setError('Failed to load prescriptions: ' + (err.response?.data?.message || err.message));
      }
      
      setLoading(false);
    }
  };

  const handleDispense = async (prescriptionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${baseURL}/prescription/${prescriptionId}`, {
        status: 'Dispensed',
        dispensedBy: user.staffId,
        dispensedDate: new Date()
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Prescription dispensed:', response.data);
      alert('Prescription dispensed successfully');
      
      await fetchPrescriptions();
      
      if (selectedPrescription && selectedPrescription._id === prescriptionId) {
        const updatedPrescription = prescriptions.find(p => p._id === prescriptionId);
        if (updatedPrescription) {
          setSelectedPrescription({...updatedPrescription, status: 'Dispensed', dispensedDate: new Date()});
        }
      }
      
    } catch (err) {
      console.error('Error dispensing prescription:', err);
      alert('Error dispensing prescription: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleComplete = async (prescriptionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${baseURL}/prescription/${prescriptionId}`, {
        status: 'Completed'
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Prescription completed:', response.data);
      alert('Prescription marked as completed');
      
      await fetchPrescriptions();
      
      if (selectedPrescription && selectedPrescription._id === prescriptionId) {
        const updatedPrescription = prescriptions.find(p => p._id === prescriptionId);
        if (updatedPrescription) {
          setSelectedPrescription({...updatedPrescription, status: 'Completed'});
        }
      }
      
    } catch (err) {
      console.error('Error completing prescription:', err);
      alert('Error completing prescription: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    filter === 'All' ? true : p.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 font-['Poppins']">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
            <div className="bg-purple-600 p-2.5 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v6H4zm16-2H4V7h16v2zm0 9H4v-6h16v6zM8 13h8v2H8z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Pharmacist Dashboard</h1>
              <p className="text-xs text-gray-600">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPrescriptions}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors"
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

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{prescriptions.length}</p>
                <p className="text-xs text-gray-600">Total Prescriptions</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {prescriptions.filter(p => p.status === 'Active').length}
                </p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {prescriptions.filter(p => p.status === 'Dispensed').length}
                </p>
                <p className="text-xs text-gray-600">Dispensed</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {prescriptions.filter(p => p.status === 'Completed').length}
                </p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {['All', 'Active', 'Dispensed', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  filter === status
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {status} ({prescriptions.filter(p => status === 'All' ? true : p.status === status).length})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5 bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Prescriptions ({filteredPrescriptions.length})
            </h2>
            
            {filteredPrescriptions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm text-gray-500">No {filter.toLowerCase()} prescriptions</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredPrescriptions.map((prescription) => (
                  <button
                    key={prescription._id}
                    onClick={() => setSelectedPrescription(prescription)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedPrescription?._id === prescription._id
                        ? 'bg-purple-50 border-2 border-purple-200'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium text-sm text-gray-800">
                          Patient ID: {prescription.patientId}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-md ${
                        prescription.status === 'Active' ? 'bg-yellow-100 text-yellow-700' :
                        prescription.status === 'Dispensed' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {prescription.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {prescription.medicines?.length || 0} medicine(s)
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(prescription.createdAt).toLocaleDateString()} • {new Date(prescription.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-7">
            {selectedPrescription ? (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">Prescription Details</h2>
                    <p className="text-sm text-gray-600">Patient ID: {selectedPrescription.patientId}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedPrescription.status === 'Active' && (
                      <button
                        onClick={() => handleDispense(selectedPrescription._id)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        Mark as Dispensed
                      </button>
                    )}
                    {selectedPrescription.status === 'Dispensed' && (
                      <button
                        onClick={() => handleComplete(selectedPrescription._id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Prescribed Date</p>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(selectedPrescription.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-md ${
                        selectedPrescription.status === 'Active' ? 'bg-yellow-100 text-yellow-700' :
                        selectedPrescription.status === 'Dispensed' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {selectedPrescription.status}
                      </span>
                    </div>
                    {selectedPrescription.doctorId && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Prescribed By</p>
                        <p className="text-sm font-medium text-gray-800">{selectedPrescription.doctorId}</p>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-semibold text-gray-800 mb-4">Medicines</h3>
                <div className="space-y-3 mb-6">
                  {selectedPrescription.medicines && selectedPrescription.medicines.length > 0 ? (
                    selectedPrescription.medicines.map((med, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">{med.name}</h4>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">
                            Medicine #{idx + 1}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-2">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Dosage</p>
                            <p className="text-sm font-medium text-gray-800">{med.dosage}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Frequency</p>
                            <p className="text-sm font-medium text-gray-800">{med.frequency}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Duration</p>
                            <p className="text-sm font-medium text-gray-800">{med.duration}</p>
                          </div>
                        </div>
                        {med.instructions && (
                          <div className="bg-white p-3 rounded-lg mt-2">
                            <p className="text-xs text-gray-600 mb-1">Instructions</p>
                            <p className="text-sm text-gray-800">{med.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No medicines listed</p>
                  )}
                </div>

                {selectedPrescription.notes && (
                  <div className="bg-blue-50 p-4 rounded-xl mb-4">
                    <p className="text-xs text-blue-600 font-medium mb-2">Additional Notes</p>
                    <p className="text-sm text-blue-900">{selectedPrescription.notes}</p>
                  </div>
                )}

                {selectedPrescription.status === 'Dispensed' && selectedPrescription.dispensedDate && (
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-xs text-green-600 font-medium mb-1">Dispensed Information</p>
                    <p className="text-sm text-green-900">
                      Dispensed on {new Date(selectedPrescription.dispensedDate).toLocaleDateString()} at{' '}
                      {new Date(selectedPrescription.dispensedDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    {selectedPrescription.dispensedBy && (
                      <p className="text-sm text-green-900 mt-1">
                        By: {selectedPrescription.dispensedBy}
                      </p>
                    )}
                  </div>
                )}

                {selectedPrescription.status === 'Completed' && (
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-xs text-blue-600 font-medium mb-1">Completed</p>
                    <p className="text-sm text-blue-900">
                      This prescription has been completed and closed
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">Select a prescription to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}