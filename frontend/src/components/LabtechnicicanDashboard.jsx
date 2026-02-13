import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function LabTechnicianDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pendingTests, setPendingTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [resultsForm, setResultsForm] = useState({
    results: '',
    findings: '',
    interpretation: '',
    recommendedActions: '',
    abnormalFindings: false,
    criticalValues: false
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
    fetchTests();
  }, [navigate]);

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const [pendingRes, completedRes] = await Promise.all([
        axios.get(`${baseURL}/health-visits/lab/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${baseURL}/health-visits/lab/completed`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setPendingTests(pendingRes.data);
      setCompletedTests(completedRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tests:', err);
      setLoading(false);
    }
  };

  const handleSelectVisit = (visit) => {
    setSelectedVisit(visit);
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const resultData = {
        labResults: resultsForm,
        status: resultsForm.criticalValues || resultsForm.abnormalFindings ? 'doctor_review' : 'lab_completed',
        requiresDoctorReview: resultsForm.criticalValues || resultsForm.abnormalFindings
      };

      await axios.put(`${baseURL}/health-visits/${selectedVisit._id}/lab-results`, resultData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const message = resultsForm.criticalValues || resultsForm.abnormalFindings
        ? 'Results submitted! Doctor and nurse have been notified due to abnormal findings.'
        : 'Results submitted successfully! Nurse has been notified.';

      alert(message);
      setShowResultsModal(false);
      resetResultsForm();
      setSelectedVisit(null);
      fetchTests();
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
      criticalValues: false
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-pink-50 font-['Poppins']">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium">Loading Laboratory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 font-['Poppins']">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">School Laboratory</h1>
                <p className="text-sm text-gray-600">Lab Technician: {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4">
                <div className="text-center px-4 py-2 bg-purple-100 rounded-xl">
                  <p className="text-xs text-gray-600">Pending</p>
                  <p className="text-lg font-bold text-purple-600">{pendingTests.length}</p>
                </div>
                <div className="text-center px-4 py-2 bg-green-100 rounded-xl">
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-lg font-bold text-green-600">{completedTests.length}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all shadow-md"
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
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pending Tests
            {pendingTests.length > 0 && (
              <span className={`ml-2 px-2 py-1 text-xs font-bold rounded-full ${
                activeTab === 'pending' ? 'bg-white text-purple-600' : 'bg-purple-100 text-purple-700'
              }`}>
                {pendingTests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Completed Tests
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Tests List */}
          <div className="col-span-5 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {activeTab === 'pending' ? 'Test Queue' : 'Completed Tests'}
            </h2>
            
            <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-2">
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
                (activeTab === 'pending' ? pendingTests : completedTests).map((visit) => (
                  <button
                    key={visit._id}
                    onClick={() => handleSelectVisit(visit)}
                    className={`w-full text-left p-5 rounded-xl transition-all border-2 ${
                      selectedVisit?._id === visit._id
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 border-transparent hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{visit.studentName}</h3>
                        <p className="text-sm text-gray-600">ID: {visit.studentId}</p>
                        <p className="text-sm text-gray-600">Grade {visit.grade}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                          {visit.labRequest?.testType}
                        </span>
                        {visit.labRequest?.urgency === 'Emergency' && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            URGENT
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Chief Complaint</p>
                      <p className="text-sm font-medium text-gray-800">{visit.chiefComplaint}</p>
                    </div>

                    {visit.symptoms && (
                      <p className="text-xs text-gray-600 mb-2">
                        <span className="font-semibold">Symptoms:</span> {visit.symptoms}
                      </p>
                    )}

                    {visit.labRequest?.testDetails && (
                      <p className="text-xs text-gray-600 mb-2">
                        <span className="font-semibold">Test Details:</span> {visit.labRequest.testDetails}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        Visit: {visit.visitNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(visit.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Visit Details */}
          <div className="col-span-7">
            {selectedVisit ? (
              <div className="space-y-6">
                {/* Student Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                        {selectedVisit.studentName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedVisit.studentName}</h2>
                        <p className="text-gray-600">Student ID: {selectedVisit.studentId}</p>
                        <p className="text-gray-600">Grade {selectedVisit.grade}</p>
                      </div>
                    </div>
                    {activeTab === 'pending' && (
                      <button
                        onClick={() => setShowResultsModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                      >
                        Submit Results
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                      <p className="text-xs text-gray-600 mb-1">Test Type</p>
                      <p className="text-sm font-bold text-gray-800">{selectedVisit.labRequest?.testType}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                      <p className="text-xs text-gray-600 mb-1">Urgency</p>
                      <p className="text-sm font-bold text-gray-800">{selectedVisit.labRequest?.urgency}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border-l-4 border-purple-500 mb-4">
                    <h4 className="font-bold text-gray-800 mb-2">Chief Complaint</h4>
                    <p className="text-gray-700">{selectedVisit.chiefComplaint}</p>
                  </div>

                  {selectedVisit.symptoms && (
                    <div className="bg-gray-50 p-5 rounded-xl mb-4">
                      <h4 className="font-bold text-gray-800 mb-2">Symptoms</h4>
                      <p className="text-gray-700">{selectedVisit.symptoms}</p>
                    </div>
                  )}

                  {selectedVisit.labRequest?.testDetails && (
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                      <h4 className="font-bold text-gray-800 mb-2">Test Instructions</h4>
                      <p className="text-gray-700">{selectedVisit.labRequest.testDetails}</p>
                    </div>
                  )}
                </div>

                {/* Medical Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Medical Information</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Blood Group</p>
                      <p className="text-sm font-bold text-gray-800">{selectedVisit.bloodGroup || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Age</p>
                      <p className="text-sm font-bold text-gray-800">{selectedVisit.age} years</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Gender</p>
                      <p className="text-sm font-bold text-gray-800">{selectedVisit.gender}</p>
                    </div>
                  </div>

                  {selectedVisit.allergies && (
                    <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl mb-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-bold text-red-800">Known Allergies</p>
                          <p className="text-sm text-red-700 mt-1">{selectedVisit.allergies}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedVisit.chronicConditions && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-bold text-yellow-800">Chronic Conditions</p>
                          <p className="text-sm text-yellow-700 mt-1">{selectedVisit.chronicConditions}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lab Results if completed */}
                {activeTab === 'completed' && selectedVisit.labResults && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Lab Results</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border-l-4 border-green-500">
                        <h4 className="font-bold text-gray-800 mb-2">Results</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedVisit.labResults.results}</p>
                      </div>

                      {selectedVisit.labResults.findings && (
                        <div className="bg-gray-50 p-5 rounded-xl">
                          <h4 className="font-bold text-gray-800 mb-2">Findings</h4>
                          <p className="text-gray-700">{selectedVisit.labResults.findings}</p>
                        </div>
                      )}

                      {selectedVisit.labResults.interpretation && (
                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                          <h4 className="font-bold text-gray-800 mb-2">Interpretation</h4>
                          <p className="text-gray-700">{selectedVisit.labResults.interpretation}</p>
                        </div>
                      )}

                      {selectedVisit.labResults.recommendedActions && (
                        <div className="bg-purple-50 p-5 rounded-xl border border-purple-200">
                          <h4 className="font-bold text-gray-800 mb-2">Recommended Actions</h4>
                          <p className="text-gray-700">{selectedVisit.labResults.recommendedActions}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {selectedVisit.labResults.abnormalFindings && (
                          <div className="flex-1 bg-orange-50 border-2 border-orange-200 p-4 rounded-xl">
                            <p className="text-sm font-bold text-orange-800">⚠️ Abnormal Findings</p>
                          </div>
                        )}
                        {selectedVisit.labResults.criticalValues && (
                          <div className="flex-1 bg-red-50 border-2 border-red-200 p-4 rounded-xl">
                            <p className="text-sm font-bold text-red-800">🚨 Critical Values</p>
                          </div>
                        )}
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Results Modal */}
      {showResultsModal && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-t-3xl">
              <h2 className="text-2xl font-bold text-white">Submit Test Results</h2>
              <p className="text-purple-100 text-sm mt-1">
                {selectedVisit.labRequest?.testType} - {selectedVisit.studentName}
              </p>
            </div>
            <form onSubmit={handleSubmitResults} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Test Results *</label>
                <textarea
                  required
                  value={resultsForm.results}
                  onChange={(e) => setResultsForm({...resultsForm, results: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-sm"
                  rows={6}
                  placeholder="Enter detailed test results..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Findings</label>
                <textarea
                  value={resultsForm.findings}
                  onChange={(e) => setResultsForm({...resultsForm, findings: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  rows={3}
                  placeholder="Key findings from the test..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Interpretation</label>
                <textarea
                  value={resultsForm.interpretation}
                  onChange={(e) => setResultsForm({...resultsForm, interpretation: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  rows={3}
                  placeholder="Clinical interpretation..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Recommended Actions</label>
                <textarea
                  value={resultsForm.recommendedActions}
                  onChange={(e) => setResultsForm({...resultsForm, recommendedActions: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  rows={2}
                  placeholder="Recommended follow-up actions..."
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
                      <p className="text-xs text-gray-600">Immediate attention required</p>
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
                    <p className="text-sm font-medium text-yellow-800">
                      {resultsForm.criticalValues 
                        ? '⚠️ Doctor will be notified immediately about critical values'
                        : '⚠️ Doctor will be notified about abnormal findings'}
                    </p>
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                >
                  Submit Results
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}