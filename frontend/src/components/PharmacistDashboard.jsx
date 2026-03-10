import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function PharmacistDashboard() {
  const navigate = useNavigate();
  const [user, setUser]                           = useState(null);
  const [prescriptions, setPrescriptions]         = useState([]);
  const [notifications, setNotifications]         = useState([]);
  const [unreadCount, setUnreadCount]             = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [filter, setFilter]                       = useState('Active');
  const [error, setError]                         = useState(null);

  
  const fetchPrescriptions = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/prescription/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } else {
        setError('Failed to load prescriptions: ' + (err.response?.data?.message || err.message));
      }
      setLoading(false);
    }
  }, [navigate]);

 
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/notifications/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token   = localStorage.getItem('token');
    if (!userStr || !token) { navigate('/'); return; }

    try {
      const userData = JSON.parse(userStr);
      if (userData.role !== 'pharmacist') { navigate('/'); return; }
      setUser(userData);
      fetchPrescriptions();
      fetchNotifications();

      const interval = setInterval(() => {
        fetchNotifications();
        fetchPrescriptions();
      }, 30000);
      return () => clearInterval(interval);
    } catch (err) {
      console.error('Error parsing user data:', err);
      navigate('/');
    }
  }, [navigate, fetchPrescriptions, fetchNotifications]);

  
  const markNotificationAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${baseURL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${baseURL}/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  
  const handleDispense = async (prescriptionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${baseURL}/prescription/${prescriptionId}`, {
        status:       'Dispensed',
        dispensedBy:  user.staffId || user.name,
        dispensedDate: new Date()
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('Prescription dispensed successfully');
      await fetchPrescriptions();
      if (selectedPrescription?._id === prescriptionId) {
        setSelectedPrescription(response.data.prescription);
      }
    } catch (err) {
      alert('Error dispensing: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleComplete = async (prescriptionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${baseURL}/prescription/${prescriptionId}`, {
        status: 'Completed'
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('Prescription marked as completed');
      await fetchPrescriptions();
      if (selectedPrescription?._id === prescriptionId) {
        setSelectedPrescription(response.data.prescription);
      }
    } catch (err) {
      alert('Error completing: ' + (err.response?.data?.message || err.message));
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

  
  const patientName = (p) => p.patientId?.fullName || p.patientId?.studentId || 'Unknown Patient';
  const patientId   = (p) => p.patientId?.studentId || p.patientId?.patientId || 'N/A';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white font-['Poppins']">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Poppins']">

      
      <div className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Pharmacist Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user?.name}</p>
            </div>
            <div className="flex items-center gap-3">

             
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 transition-colors"
                  aria-label="Notifications"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-300 shadow-lg z-50 max-h-[500px] flex flex-col">
                      <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between bg-gray-50 sticky top-0">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Notifications {unreadCount > 0 && <span className="ml-1 text-xs text-gray-500">({unreadCount} unread)</span>}
                        </h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1 divide-y divide-gray-200">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-sm text-gray-500">No notifications</div>
                        ) : notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => markNotificationAsRead(notif._id)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {!notif.isRead
                                  ? <span className="w-2 h-2 bg-blue-600 rounded-full block" />
                                  : <span className="w-2 h-2 bg-gray-300 rounded-full block" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="px-2 py-1 bg-yellow-50 border border-yellow-200">
                <p className="text-xs text-yellow-700 font-semibold">Active: {prescriptions.filter(p => p.status === 'Active').length}</p>
              </div>
              <button onClick={fetchPrescriptions} className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium transition-colors">Refresh</button>
              <button onClick={handleLogout} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600 uppercase tracking-wide">Total Prescriptions</p><p className="text-2xl font-bold text-gray-900 mt-1">{prescriptions.length}</p></div>
              <div className="bg-gray-50 p-3"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></div>
            </div>
          </div>
          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600 uppercase tracking-wide">Pending</p><p className="text-2xl font-bold text-gray-900 mt-1">{prescriptions.filter(p => p.status === 'Active').length}</p></div>
              <div className="bg-yellow-50 p-3"><svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
          </div>
          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600 uppercase tracking-wide">Dispensed</p><p className="text-2xl font-bold text-gray-900 mt-1">{prescriptions.filter(p => p.status === 'Dispensed').length}</p></div>
              <div className="bg-green-50 p-3"><svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
            </div>
          </div>
          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600 uppercase tracking-wide">Completed</p><p className="text-2xl font-bold text-gray-900 mt-1">{prescriptions.filter(p => p.status === 'Completed').length}</p></div>
              <div className="bg-blue-50 p-3"><svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
          </div>
        </div>

        
        <div className="bg-white border border-gray-300 inline-flex mb-6">
          {['All', 'Active', 'Dispensed', 'Completed'].map((status, i) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-3 font-semibold transition-all text-sm ${i > 0 ? 'border-l border-gray-300' : ''} ${filter === status ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {status} ({prescriptions.filter(p => status === 'All' ? true : p.status === status).length})
            </button>
          ))}
        </div>

        
        <div className="grid grid-cols-12 gap-6">

          
          <div className="col-span-5 bg-white border border-gray-300 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
              <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto">
                {filteredPrescriptions.map((prescription) => (
                  <button
                    key={prescription._id}
                    onClick={() => setSelectedPrescription(prescription)}
                    className={`w-full text-left p-4 transition-all ${
                      selectedPrescription?._id === prescription._id
                        ? 'bg-gray-50 border-2 border-gray-900'
                        : 'bg-white hover:bg-gray-50 border-2 border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900">{patientName(prescription)}</h3>
                        <p className="text-xs text-gray-600">ID: {patientId(prescription)}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold ${
                        prescription.status === 'Active'    ? 'bg-yellow-100 text-yellow-700' :
                        prescription.status === 'Dispensed' ? 'bg-green-100 text-green-700'  :
                                                              'bg-blue-100 text-blue-700'
                      }`}>
                        {prescription.status}
                      </span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-2 mb-2">
                      <p className="text-xs font-semibold text-gray-600">Dr. {prescription.doctorName || prescription.doctorId || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{prescription.medicines?.length || 0} medicine(s)</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(prescription.createdAt).toLocaleDateString()} • {new Date(prescription.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

           
          <div className="col-span-7">
            {selectedPrescription ? (
              <div className="space-y-4">
                <div className="bg-white border border-gray-300 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{patientName(selectedPrescription)}</h2>
                      <p className="text-sm text-gray-600">Student ID: {patientId(selectedPrescription)}</p>
                    </div>
                    <div className="flex gap-2">
                      {selectedPrescription.status === 'Active' && (
                        <button
                          onClick={() => handleDispense(selectedPrescription._id)}
                          className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
                        >
                          Mark as Dispensed
                        </button>
                      )}
                      {selectedPrescription.status === 'Dispensed' && (
                        <button
                          onClick={() => handleComplete(selectedPrescription._id)}
                          className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
                        >
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="border border-gray-300 p-3">
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <span className={`text-sm font-semibold ${
                        selectedPrescription.status === 'Active'    ? 'text-yellow-700' :
                        selectedPrescription.status === 'Dispensed' ? 'text-green-700'  :
                                                                      'text-blue-700'
                      }`}>{selectedPrescription.status}</span>
                    </div>
                    <div className="border border-gray-300 p-3">
                      <p className="text-xs text-gray-600 mb-1">Prescribed By</p>
                      <p className="text-sm font-semibold text-gray-900">Dr. {selectedPrescription.doctorName || 'Unknown'}</p>
                    </div>
                    <div className="border border-gray-300 p-3">
                      <p className="text-xs text-gray-600 mb-1">Date</p>
                      <p className="text-sm font-semibold text-gray-900">{new Date(selectedPrescription.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="border border-gray-300 p-3">
                      <p className="text-xs text-gray-600 mb-1">Medicines</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedPrescription.medicines?.length || 0}</p>
                    </div>
                  </div>

                  {selectedPrescription.patientId?.age && (
                    <div className="bg-gray-50 border border-gray-300 p-3 mb-4">
                      <p className="text-xs text-gray-600">Age: <span className="font-semibold text-gray-900">{selectedPrescription.patientId.age} years</span>
                        {selectedPrescription.patientId.gender && <> • <span className="font-semibold text-gray-900">{selectedPrescription.patientId.gender}</span></>}
                      </p>
                    </div>
                  )}
                </div>

                 
                <div className="bg-white border border-gray-300 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Medicines</h3>
                  <div className="space-y-3">
                    {selectedPrescription.medicines?.length > 0 ? (
                      selectedPrescription.medicines.map((med, idx) => (
                        <div key={idx} className="border border-gray-300 p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{med.name}</h4>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 font-medium">#{idx + 1}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mb-2">
                            <div className="bg-gray-50 border border-gray-200 p-2">
                              <p className="text-xs text-gray-600 mb-1">Dosage</p>
                              <p className="text-sm font-medium text-gray-900">{med.dosage}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-2">
                              <p className="text-xs text-gray-600 mb-1">Frequency</p>
                              <p className="text-sm font-medium text-gray-900">{med.frequency}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-2">
                              <p className="text-xs text-gray-600 mb-1">Duration</p>
                              <p className="text-sm font-medium text-gray-900">{med.duration}</p>
                            </div>
                          </div>
                          {med.instructions && (
                            <div className="bg-gray-50 border border-gray-200 p-3 mt-2">
                              <p className="text-xs text-gray-600 mb-1">Instructions</p>
                              <p className="text-sm text-gray-900">{med.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4 text-sm">No medicines listed</p>
                    )}
                  </div>
                </div>

                
                {selectedPrescription.notes && (
                  <div className="bg-white border border-gray-300 p-5">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Additional Notes</p>
                    <p className="text-sm text-gray-900">{selectedPrescription.notes}</p>
                  </div>
                )}

                {selectedPrescription.status === 'Dispensed' && selectedPrescription.dispensedDate && (
                  <div className="bg-green-50 border border-green-300 p-4">
                    <p className="text-xs font-semibold text-green-700 uppercase mb-2">Dispensed</p>
                    <p className="text-sm text-green-900">
                      {new Date(selectedPrescription.dispensedDate).toLocaleDateString()} at {new Date(selectedPrescription.dispensedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {selectedPrescription.dispensedBy && <p className="text-sm text-green-900 mt-1">By: {selectedPrescription.dispensedBy}</p>}
                  </div>
                )}

                {selectedPrescription.status === 'Completed' && (
                  <div className="bg-blue-50 border border-blue-300 p-4">
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Completed</p>
                    <p className="text-sm text-blue-900">This prescription has been completed and closed.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-gray-300 p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 font-medium">Select a prescription to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}