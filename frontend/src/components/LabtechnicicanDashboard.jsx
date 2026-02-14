import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from './NotificationBell';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function LabTechnicianDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingTests, setPendingTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [resultsForm, setResultsForm] = useState({
    results: '',
    findings: '',
    interpretation: '',
    abnormalFindings: false,
    criticalValues: false,
    requiresDoctorReview: false
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      navigate('/');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'labtechnician') {
      navigate('/');
      return;
    }

    setUser(userData);
    fetchPendingTests();
    fetchCompletedTests();
  }, [navigate]);

  const fetchPendingTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/health-visits/lab/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingTests(res.data.visits || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pending tests:', err);
      setLoading(false);
    }
  };

  const fetchCompletedTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/health-visits/lab/completed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompletedTests(res.data.visits || []);
    } catch (err) {
      console.error('Error fetching completed tests:', err);
    }
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      
      let status = 'lab_completed';
      let requiresDoctorReview = resultsForm.requiresDoctorReview;

      if (resultsForm.criticalValues || resultsForm.abnormalFindings) {
        requiresDoctorReview = true;
        status = 'doctor_review';
      }

      await axios.put(
        `${baseURL}/health-visits/${selectedTest._id}/lab-results`,
        {
          labResults: resultsForm,
          status,
          requiresDoctorReview
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Lab results submitted successfully!');
      setShowResultsModal(false);
      resetResultsForm();
      fetchPendingTests();
      fetchCompletedTests();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetResultsForm = () => {
    setResultsForm({
      results: '',
      findings: '',
      interpretation: '',
      abnormalFindings: false,
      criticalValues: false,
      requiresDoctorReview: false
    });
    setSelectedTest(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

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
      {/* Header */}
      <div className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Lab Technician Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="px-2 py-1 bg-orange-50 border border-orange-200">
                <p className="text-xs text-orange-700 font-semibold">Pending: {pendingTests.length}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Pending Tests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingTests.length}</p>
              </div>
              <div className="bg-orange-50 p-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {completedTests.filter(test => {
                    const today = new Date().toDateString();
                    return new Date(test.completedAt).toDateString() === today;
                  }).length}
                </p>
              </div>
              <div className="bg-green-50 p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Total Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{completedTests.length}</p>
              </div>
              <div className="bg-blue-50 p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-300 inline-flex mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-semibold transition-all text-sm ${
              activeTab === 'pending'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Pending Tests ({pendingTests.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 font-semibold transition-all text-sm border-l border-gray-300 ${
              activeTab === 'completed'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Completed Tests ({completedTests.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'pending' ? (
          <div className="bg-white border border-gray-300">
            {pendingTests.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-500">No pending tests</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pendingTests.map((test) => (
                  <div key={test._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{test.studentName}</h3>
                        <p className="text-sm text-gray-600">ID: {test.studentId} • Grade {test.grade}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTest(test);
                          setShowResultsModal(true);
                        }}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
                      >
                        Submit Results
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="border border-gray-300 p-3">
                        <p className="text-xs text-gray-600 mb-1">Test Type</p>
                        <p className="text-sm font-semibold text-gray-900">{test.labRequest?.testType}</p>
                      </div>
                      <div className="border border-gray-300 p-3">
                        <p className="text-xs text-gray-600 mb-1">Urgency</p>
                        <p className={`text-sm font-semibold ${
                          test.labRequest?.urgency === 'Emergency' ? 'text-red-600' :
                          test.labRequest?.urgency === 'Urgent' ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {test.labRequest?.urgency}
                        </p>
                      </div>
                      <div className="border border-gray-300 p-3">
                        <p className="text-xs text-gray-600 mb-1">Age</p>
                        <p className="text-sm font-semibold text-gray-900">{test.age} years</p>
                      </div>
                      <div className="border border-gray-300 p-3">
                        <p className="text-xs text-gray-600 mb-1">Blood Group</p>
                        <p className="text-sm font-semibold text-gray-900">{test.bloodGroup || 'Unknown'}</p>
                      </div>
                    </div>

                    {test.allergies && (
                      <div className="bg-red-50 border border-red-300 p-3 mb-3">
                        <p className="text-sm font-semibold text-red-900">⚠️ Allergies: {test.allergies}</p>
                      </div>
                    )}

                    <div className="bg-gray-50 border border-gray-300 p-4">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Chief Complaint</p>
                      <p className="text-sm text-gray-900">{test.chiefComplaint}</p>
                      {test.labRequest?.testDetails && (
                        <>
                          <p className="text-xs font-semibold text-gray-600 mb-1 mt-3">Test Details</p>
                          <p className="text-sm text-gray-900">{test.labRequest.testDetails}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-300">
            {completedTests.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">No completed tests</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {completedTests.map((test) => (
                  <div key={test._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{test.studentName}</h3>
                        <p className="text-sm text-gray-600">ID: {test.studentId} • Grade {test.grade}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold">
                        COMPLETED
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="border border-gray-300 p-3">
                        <p className="text-xs text-gray-600 mb-1">Test Type</p>
                        <p className="text-sm font-semibold text-gray-900">{test.labRequest?.testType}</p>
                      </div>
                      <div className="border border-gray-300 p-3">
                        <p className="text-xs text-gray-600 mb-1">Completed</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {test.completedAt ? new Date(test.completedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="border border-gray-300 p-3">
                        <p className="text-xs text-gray-600 mb-1">Status</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {test.labResults?.abnormalFindings && '⚠️ Abnormal'}
                          {test.labResults?.criticalValues && '🚨 Critical'}
                          {!test.labResults?.abnormalFindings && !test.labResults?.criticalValues && '✓ Normal'}
                        </p>
                      </div>
                    </div>

                    {test.labResults && (
                      <div className="bg-purple-50 border border-purple-300 p-4">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Results</p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{test.labResults.results}</p>
                        {test.labResults.findings && (
                          <>
                            <p className="text-xs font-semibold text-gray-600 mb-1 mt-3">Findings</p>
                            <p className="text-sm text-gray-900">{test.labResults.findings}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Results Modal */}
      {showResultsModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Submit Lab Results</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedTest.studentName} • {selectedTest.labRequest?.testType}
              </p>
            </div>

            <form onSubmit={handleSubmitResults} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">Test Results *</label>
                <textarea
                  required
                  value={resultsForm.results}
                  onChange={(e) => setResultsForm({...resultsForm, results: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                  rows={4}
                  placeholder="Enter detailed test results..."
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2">Findings</label>
                <textarea
                  value={resultsForm.findings}
                  onChange={(e) => setResultsForm({...resultsForm, findings: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                  rows={3}
                  placeholder="Key findings..."
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2">Interpretation</label>
                <textarea
                  value={resultsForm.interpretation}
                  onChange={(e) => setResultsForm({...resultsForm, interpretation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                  rows={2}
                  placeholder="Clinical interpretation..."
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-300">
                <label className="flex items-center gap-3 p-3 border border-gray-300 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={resultsForm.abnormalFindings}
                    onChange={(e) => setResultsForm({...resultsForm, abnormalFindings: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Abnormal Findings</p>
                    <p className="text-xs text-gray-600">Results outside normal range</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-red-300 bg-red-50 cursor-pointer hover:bg-red-100">
                  <input
                    type="checkbox"
                    checked={resultsForm.criticalValues}
                    onChange={(e) => setResultsForm({...resultsForm, criticalValues: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-red-900">Critical Values</p>
                    <p className="text-xs text-red-700">Results require immediate medical attention</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-300 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={resultsForm.requiresDoctorReview}
                    onChange={(e) => setResultsForm({...resultsForm, requiresDoctorReview: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Requires Doctor Review</p>
                    <p className="text-xs text-gray-600">Send to doctor for evaluation</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => {
                    setShowResultsModal(false);
                    resetResultsForm();
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
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