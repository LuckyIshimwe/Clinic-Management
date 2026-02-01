import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function LabTechnicianDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pendingTests, setPendingTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('pending');
  
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [resultsForm, setResultsForm] = useState({
    results: '',
    findings: '',
    interpretation: '',
    recommendedActions: '',
    abnormalFindings: false,
    criticalValues: false,
    attachments: []
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      navigate('/');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'lab_technician') {
      navigate('/');
      return;
    }

    setUser(userData);
    fetchPendingTests();
    fetchCompletedTests();
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchPendingTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/lab-tests/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingTests(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pending tests:', err);
      setLoading(false);
    }
  };

  const fetchCompletedTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/lab-tests/completed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompletedTests(res.data);
    } catch (err) {
      console.error('Error fetching completed tests:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleTestSelect = (test) => {
    setSelectedTest(test);
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${baseURL}/lab-tests/${selectedTest._id}/complete`, resultsForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Test results submitted successfully! Nurse has been notified.');
      setShowResultsModal(false);
      resetResultsForm();
      fetchPendingTests();
      fetchCompletedTests();
      setSelectedTest(null);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetResultsForm = () => {
    setResultsForm({
      results: '',
      findings: '',
      interpretation: '',
      recommendedActions: '',
      abnormalFindings: false,
      criticalValues: false,
      attachments: []
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-teal-50 to-cyan-50 font-['Poppins']">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Lab Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 font-['Poppins']">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-3 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Laboratory Portal</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Statistics */}
              <div className="hidden md:flex items-center gap-4 mr-4">
                <div className="text-center px-4 py-2 bg-teal-50 rounded-xl">
                  <p className="text-xs text-gray-600">Pending Tests</p>
                  <p className="text-lg font-bold text-teal-600">{pendingTests.length}</p>
                </div>
                <div className="text-center px-4 py-2 bg-green-50 rounded-xl">
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-lg font-bold text-green-600">{completedTests.length}</p>
                </div>
              </div>

              {/* Notifications */}
              <button
                onClick={() => setShowNotificationsModal(true)}
                className="relative p-3 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl transition-all shadow-sm"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md p-2 mb-8 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pending Tests
            {pendingTests.length > 0 && (
              <span className={`ml-2 px-2 py-1 text-xs font-bold rounded-full ${
                activeTab === 'pending' ? 'bg-white text-teal-600' : 'bg-teal-100 text-teal-700'
              }`}>
                {pendingTests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Completed Tests
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Tests List */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {activeTab === 'pending' ? 'Tests Queue' : 'Completed Tests'}
              </h2>
              
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {(activeTab === 'pending' ? pendingTests : completedTests).length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <p className="text-gray-500 font-medium">
                      {activeTab === 'pending' ? 'No pending tests' : 'No completed tests yet'}
                    </p>
                  </div>
                ) : (
                  (activeTab === 'pending' ? pendingTests : completedTests).map((test) => (
                    <button
                      key={test._id}
                      onClick={() => handleTestSelect(test)}
                      className={`w-full text-left p-5 rounded-xl transition-all border-2 ${
                        selectedTest?._id === test._id
                          ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-300 shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100 border-transparent hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 mb-1">{test.studentName}</h3>
                          <p className="text-sm text-gray-600">ID: {test.studentId}</p>
                          <p className="text-sm text-gray-600">Grade {test.grade}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
                            {test.testType}
                          </span>
                          {test.criticalValues && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                              CRITICAL
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Chief Complaint</p>
                        <p className="text-sm font-medium text-gray-800">{test.chiefComplaint}</p>
                      </div>

                      {test.testDetails && (
                        <p className="text-xs text-gray-600 mb-2">
                          <span className="font-semibold">Details:</span> {test.testDetails}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-500">
                          Requested by: {test.nurseName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(test.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Test Details */}
          <div className="col-span-12 lg:col-span-7">
            {selectedTest ? (
              <div className="space-y-6">
                {/* Test Info Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                        {selectedTest.studentName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedTest.studentName}</h2>
                        <p className="text-gray-600">Student ID: {selectedTest.studentId}</p>
                        <p className="text-gray-600">Grade {selectedTest.grade}{selectedTest.section && `-${selectedTest.section}`}</p>
                      </div>
                    </div>
                    {activeTab === 'pending' && (
                      <button
                        onClick={() => setShowResultsModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        Submit Results
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-100">
                      <p className="text-xs text-gray-600 mb-1">Test Type</p>
                      <p className="text-sm font-bold text-gray-800">{selectedTest.testType}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                      <p className="text-xs text-gray-600 mb-1">Requested By</p>
                      <p className="text-sm font-bold text-gray-800">{selectedTest.nurseName}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border-l-4 border-purple-500 mb-4">
                    <h4 className="font-bold text-gray-800 mb-2">Chief Complaint</h4>
                    <p className="text-gray-700">{selectedTest.chiefComplaint}</p>
                  </div>

                  {selectedTest.symptoms && (
                    <div className="bg-gray-50 p-5 rounded-xl mb-4">
                      <h4 className="font-bold text-gray-800 mb-2">Symptoms</h4>
                      <p className="text-gray-700">{selectedTest.symptoms}</p>
                    </div>
                  )}

                  {selectedTest.testDetails && (
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                      <h4 className="font-bold text-gray-800 mb-2">Test Details & Instructions</h4>
                      <p className="text-gray-700">{selectedTest.testDetails}</p>
                    </div>
                  )}
                </div>

                {/* Student Medical Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Medical Information</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Blood Group</p>
                      <p className="text-sm font-bold text-gray-800">{selectedTest.bloodGroup || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Age</p>
                      <p className="text-sm font-bold text-gray-800">{selectedTest.age} years</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Gender</p>
                      <p className="text-sm font-bold text-gray-800">{selectedTest.gender}</p>
                    </div>
                  </div>

                  {selectedTest.allergies && (
                    <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl mb-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-bold text-red-800">Known Allergies</p>
                          <p className="text-sm text-red-700 mt-1">{selectedTest.allergies}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTest.chronicConditions && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-bold text-yellow-800">Chronic Conditions</p>
                          <p className="text-sm text-yellow-700 mt-1">{selectedTest.chronicConditions}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lab Results (if completed) */}
                {activeTab === 'completed' && selectedTest.labResults && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Lab Results</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border-l-4 border-green-500">
                        <h4 className="font-bold text-gray-800 mb-2">Results</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedTest.labResults.results}</p>
                      </div>

                      {selectedTest.labResults.findings && (
                        <div className="bg-gray-50 p-5 rounded-xl">
                          <h4 className="font-bold text-gray-800 mb-2">Findings</h4>
                          <p className="text-gray-700">{selectedTest.labResults.findings}</p>
                        </div>
                      )}

                      {selectedTest.labResults.interpretation && (
                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                          <h4 className="font-bold text-gray-800 mb-2">Interpretation</h4>
                          <p className="text-gray-700">{selectedTest.labResults.interpretation}</p>
                        </div>
                      )}

                      {selectedTest.labResults.recommendedActions && (
                        <div className="bg-purple-50 p-5 rounded-xl border border-purple-200">
                          <h4 className="font-bold text-gray-800 mb-2">Recommended Actions</h4>
                          <p className="text-gray-700">{selectedTest.labResults.recommendedActions}</p>
                        </div>
                      )}

                      {selectedTest.labResults.abnormalFindings && (
                        <div className="bg-orange-50 border-2 border-orange-200 p-4 rounded-xl">
                          <p className="text-sm font-bold text-orange-800">⚠️ Abnormal Findings Detected</p>
                        </div>
                      )}

                      {selectedTest.labResults.criticalValues && (
                        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl">
                          <p className="text-sm font-bold text-red-800">🚨 Critical Values - Immediate Attention Required</p>
                        </div>
                      )}

                      <div className="bg-gray-100 p-4 rounded-xl">
                        <p className="text-xs text-gray-600">
                          Completed on: {new Date(selectedTest.completedAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          Processed by: {user?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 font-medium text-lg">Select a test to view details</p>
                <p className="text-sm text-gray-400 mt-2">Choose from the list on the left</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Results Modal */}
      {showResultsModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-cyan-600 p-6 rounded-t-3xl">
              <h2 className="text-2xl font-bold text-white">Submit Test Results</h2>
              <p className="text-teal-100 text-sm mt-1">
                {selectedTest.testType} - {selectedTest.studentName}
              </p>
            </div>
            <form onSubmit={handleSubmitResults} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Test Results *</label>
                <textarea
                  required
                  value={resultsForm.results}
                  onChange={(e) => setResultsForm({...resultsForm, results: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono text-sm"
                  rows={6}
                  placeholder="Enter detailed test results here...&#10;&#10;Example:&#10;White Blood Cell Count: 7,500 cells/μL (Normal: 4,000-11,000)&#10;Red Blood Cell Count: 5.2 million cells/μL (Normal: 4.5-5.5)&#10;Hemoglobin: 14.5 g/dL (Normal: 13.5-17.5)&#10;..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Findings</label>
                <textarea
                  value={resultsForm.findings}
                  onChange={(e) => setResultsForm({...resultsForm, findings: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  rows={3}
                  placeholder="Key findings from the test..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Interpretation</label>
                <textarea
                  value={resultsForm.interpretation}
                  onChange={(e) => setResultsForm({...resultsForm, interpretation: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  rows={3}
                  placeholder="Clinical interpretation of the results..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Recommended Actions</label>
                <textarea
                  value={resultsForm.recommendedActions}
                  onChange={(e) => setResultsForm({...resultsForm, recommendedActions: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  rows={2}
                  placeholder="Recommended follow-up actions based on results..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resultsForm.abnormalFindings}
                      onChange={(e) => setResultsForm({...resultsForm, abnormalFindings: e.target.checked})}
                      className="w-6 h-6 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-gray-800">Abnormal Findings</span>
                      <p className="text-xs text-gray-600">Results outside normal range</p>
                    </div>
                  </label>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resultsForm.criticalValues}
                      onChange={(e) => setResultsForm({...resultsForm, criticalValues: e.target.checked})}
                      className="w-6 h-6 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-gray-800">Critical Values</span>
                      <p className="text-xs text-gray-600">Requires immediate attention</p>
                    </div>
                  </label>
                </div>
              </div>

              {(resultsForm.abnormalFindings || resultsForm.criticalValues) && (
                <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        {resultsForm.criticalValues 
                          ? '⚠️ Nurse and doctor will be notified immediately about critical values'
                          : '⚠️ Nurse will be notified about abnormal findings'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowResultsModal(false);
                    resetResultsForm();
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  Submit Results
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-cyan-600 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Notifications</h2>
                  <p className="text-teal-100 text-sm mt-1">{unreadCount} unread messages</p>
                </div>
                <button
                  onClick={() => setShowNotificationsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-500 font-medium text-lg">All caught up!</p>
                  <p className="text-sm text-gray-400 mt-2">No new notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                        notif.isRead 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-teal-50 border-teal-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800">{notif.title}</h3>
                          {!notif.isRead && (
                            <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{notif.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}