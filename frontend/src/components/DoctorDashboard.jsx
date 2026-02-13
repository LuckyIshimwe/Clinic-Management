import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [healthVisits, setHealthVisits] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviewForm, setReviewForm] = useState({
    doctorDiagnosis: '',
    doctorTreatment: '',
    doctorNotes: '',
    actionTaken: '',
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    notes: ''
  });

  const [referralForm, setReferralForm] = useState({
    referredTo: '',
    reason: ''
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
    fetchPendingReviews();
    fetchStudents();
  }, [navigate]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setLoading(false);
    }
  };

  const fetchPendingReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/health-visits/doctor/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingReviews(res.data);
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
    }
  };

  const fetchStudentHistory = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/health-visits/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHealthVisits(res.data);
    } catch (err) {
      console.error('Error fetching student history:', err);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    fetchStudentHistory(student.studentId);
  };

  const handleVisitSelect = (visit) => {
    setSelectedVisit(visit);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.actionTaken) {
      alert('Please select an action');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const reviewData = {
        doctorDiagnosis: reviewForm.doctorDiagnosis,
        doctorTreatment: reviewForm.doctorTreatment,
        doctorNotes: reviewForm.doctorNotes,
        status: 'completed'
      };

      if (reviewForm.actionTaken === 'prescribe') {
        reviewData.prescription = prescriptionForm;
      } else if (reviewForm.actionTaken === 'refer') {
        reviewData.referred = true;
        reviewData.referralDetails = {
          ...referralForm,
          referredAt: new Date()
        };
        reviewData.status = 'referred';
      } else if (reviewForm.actionTaken === 'hospitalize') {
        reviewData.hospitalized = true;
        reviewData.hospitalizationDetails = {
          hospital: 'School Hospital',
          reason: reviewForm.doctorNotes,
          admittedAt: new Date()
        };
      }

      await axios.put(`${baseURL}/health-visits/${selectedVisit._id}/doctor-review`, reviewData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Review completed successfully!');
      setShowReviewModal(false);
      resetForms();
      fetchPendingReviews();
      if (selectedStudent) {
        fetchStudentHistory(selectedStudent.studentId);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
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

  const resetForms = () => {
    setReviewForm({
      doctorDiagnosis: '',
      doctorTreatment: '',
      doctorNotes: '',
      actionTaken: ''
    });
    setPrescriptionForm({
      medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
      notes: ''
    });
    setReferralForm({
      referredTo: '',
      reason: ''
    });
    setSelectedVisit(null);
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
      {/* Header */}
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
            <div className="px-4 py-2 bg-teal-50 rounded-xl border border-teal-200">
              <p className="text-xs text-teal-600 font-medium">Pending Reviews</p>
              <p className="text-lg font-bold text-teal-700">{pendingReviews.length}</p>
            </div>
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
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pending Reviews ({pendingReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'students'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Students
          </button>
        </div>

        {activeTab === 'pending' ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Pending Reviews List */}
            <div className="col-span-5 bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Cases Requiring Review</h2>
              
              <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {pendingReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">No pending reviews</p>
                  </div>
                ) : (
                  pendingReviews.map((visit) => (
                    <button
                      key={visit._id}
                      onClick={() => handleVisitSelect(visit)}
                      className={`w-full text-left p-4 rounded-xl transition-all ${
                        selectedVisit?._id === visit._id
                          ? 'bg-teal-50 border-2 border-teal-200'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-gray-800">{visit.studentName}</h3>
                          <p className="text-xs text-gray-600">ID: {visit.studentId} • Grade {visit.grade}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {visit.severity === 'high' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-md">
                              HIGH
                            </span>
                          )}
                          {visit.labResults?.criticalValues && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-md">
                              CRITICAL
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                        <p className="text-xs font-semibold text-gray-600">Chief Complaint</p>
                        <p className="text-sm text-gray-800">{visit.chiefComplaint}</p>
                      </div>

                      {visit.requiresLab && visit.labResults && (
                        <div className="bg-purple-50 border border-purple-200 p-2 rounded-lg">
                          <p className="text-xs font-semibold text-purple-700">Lab Results Available</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                        <span className="text-xs text-gray-500">Visit: {visit.visitNumber}</span>
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
                <div className="space-y-4">
                  {/* Student Info */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">{selectedVisit.studentName}</h2>
                        <p className="text-sm text-gray-600">
                          Student ID: {selectedVisit.studentId} • Grade {selectedVisit.grade}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        Complete Review
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Age</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedVisit.age} years</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Gender</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedVisit.gender}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Blood Group</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedVisit.bloodGroup || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Severity</p>
                        <p className="text-sm font-semibold text-gray-800 capitalize">{selectedVisit.severity}</p>
                      </div>
                    </div>

                    {selectedVisit.allergies && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
                        <p className="text-sm font-semibold text-red-800">⚠️ Allergies: {selectedVisit.allergies}</p>
                      </div>
                    )}

                    {selectedVisit.chronicConditions && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-yellow-800">Chronic: {selectedVisit.chronicConditions}</p>
                      </div>
                    )}
                  </div>

                  {/* Visit Details */}
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">Visit Information</h3>
                    
                    <div className="space-y-3">
                      <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-lg">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Chief Complaint</p>
                        <p className="text-sm text-gray-800">{selectedVisit.chiefComplaint}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Symptoms</p>
                        <p className="text-sm text-gray-800">{selectedVisit.symptoms}</p>
                      </div>

                      {selectedVisit.nurseAssessment && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Nurse Assessment</p>
                          <p className="text-sm text-gray-800">{selectedVisit.nurseAssessment}</p>
                        </div>
                      )}

                      {selectedVisit.vitals && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Vital Signs</p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {selectedVisit.vitals.temperature && (
                              <div><span className="font-medium">Temp:</span> {selectedVisit.vitals.temperature}</div>
                            )}
                            {selectedVisit.vitals.bloodPressure && (
                              <div><span className="font-medium">BP:</span> {selectedVisit.vitals.bloodPressure}</div>
                            )}
                            {selectedVisit.vitals.heartRate && (
                              <div><span className="font-medium">HR:</span> {selectedVisit.vitals.heartRate}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lab Results if available */}
                  {selectedVisit.labResults && (
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                      <h3 className="text-base font-semibold text-gray-800 mb-4">Laboratory Results</h3>
                      
                      <div className="space-y-3">
                        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Results</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedVisit.labResults.results}</p>
                        </div>

                        {selectedVisit.labResults.findings && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Findings</p>
                            <p className="text-sm text-gray-800">{selectedVisit.labResults.findings}</p>
                          </div>
                        )}

                        {selectedVisit.labResults.interpretation && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Interpretation</p>
                            <p className="text-sm text-gray-800">{selectedVisit.labResults.interpretation}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {selectedVisit.labResults.abnormalFindings && (
                            <div className="flex-1 bg-orange-50 border border-orange-200 p-3 rounded-lg text-center">
                              <p className="text-xs font-semibold text-orange-700">⚠️ Abnormal</p>
                            </div>
                          )}
                          {selectedVisit.labResults.criticalValues && (
                            <div className="flex-1 bg-red-50 border border-red-200 p-3 rounded-lg text-center">
                              <p className="text-xs font-semibold text-red-700">🚨 Critical</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">Select a case to review</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // All Students Tab
          <div className="grid grid-cols-12 gap-6">
            {/* Students List */}
            <div className="col-span-4 bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">All Students</h2>
              
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                {students.map((student) => (
                  <button
                    key={student._id}
                    onClick={() => handleStudentSelect(student)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedStudent?._id === student._id
                        ? 'bg-teal-50 border-2 border-teal-200'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <h3 className="font-semibold text-sm text-gray-800">{student.fullName}</h3>
                    <p className="text-xs text-gray-600">ID: {student.studentId} • Grade {student.grade}</p>
                    <p className="text-xs text-gray-500 mt-1">{student.age}y • {student.gender}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Student Health History */}
            <div className="col-span-8">
              {selectedStudent ? (
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Health History - {selectedStudent.fullName}
                  </h2>
                  
                  <div className="space-y-3">
                    {healthVisits.length === 0 ? (
                      <p className="text-center text-gray-500 py-8 text-sm">No health visits recorded</p>
                    ) : (
                      healthVisits.map((visit) => (
                        <div key={visit._id} className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-800">{visit.chiefComplaint}</h4>
                              <p className="text-xs text-gray-600 mt-1">{visit.symptoms}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                              visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                              visit.status === 'referred' ? 'bg-purple-100 text-purple-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {visit.status.toUpperCase()}
                            </span>
                          </div>

                          {visit.doctorDiagnosis && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Diagnosis:</span> {visit.doctorDiagnosis}
                              </p>
                              {visit.doctorTreatment && (
                                <p className="text-xs text-gray-600 mt-1">
                                  <span className="font-medium">Treatment:</span> {visit.doctorTreatment}
                                </p>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(visit.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-gray-500 font-medium">Select a student to view health history</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Doctor Review Modal */}
      {showReviewModal && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Doctor's Review</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedVisit.studentName} • Visit {selectedVisit.visitNumber}</p>
            </div>
            <form onSubmit={handleReview} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={reviewForm.doctorDiagnosis}
                  onChange={(e) => setReviewForm({...reviewForm, doctorDiagnosis: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan *</label>
                <textarea
                  required
                  value={reviewForm.doctorTreatment}
                  onChange={(e) => setReviewForm({...reviewForm, doctorTreatment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={reviewForm.doctorNotes}
                  onChange={(e) => setReviewForm({...reviewForm, doctorNotes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  rows={2}
                />
              </div>

              {/* Action Selection */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Action Required *</h3>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="treat"
                      checked={reviewForm.actionTaken === 'treat'}
                      onChange={(e) => setReviewForm({...reviewForm, actionTaken: e.target.value})}
                      className="mt-1 w-4 h-4 text-teal-600"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-800">Complete Treatment</p>
                      <p className="text-xs text-gray-600">Student can return to class</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="prescribe"
                      checked={reviewForm.actionTaken === 'prescribe'}
                      onChange={(e) => setReviewForm({...reviewForm, actionTaken: e.target.value})}
                      className="mt-1 w-4 h-4 text-teal-600"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-800">Prescribe Medication</p>
                      <p className="text-xs text-gray-600">Add prescription details</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="refer"
                      checked={reviewForm.actionTaken === 'refer'}
                      onChange={(e) => setReviewForm({...reviewForm, actionTaken: e.target.value})}
                      className="mt-1 w-4 h-4 text-teal-600"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-800">Refer to Specialist</p>
                      <p className="text-xs text-gray-600">External referral required</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="action"
                      value="hospitalize"
                      checked={reviewForm.actionTaken === 'hospitalize'}
                      onChange={(e) => setReviewForm({...reviewForm, actionTaken: e.target.value})}
                      className="mt-1 w-4 h-4 text-teal-600"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-800">Hospitalize</p>
                      <p className="text-xs text-gray-600">Requires admission</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Conditional Forms */}
              {reviewForm.actionTaken === 'prescribe' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-gray-800">Prescription Details</h4>
                  {prescriptionForm.medicines.map((med, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-gray-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Medicine {idx + 1}</span>
                        {prescriptionForm.medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedicine(idx)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Medicine name"
                        value={med.name}
                        onChange={(e) => {
                          const newMeds = [...prescriptionForm.medicines];
                          newMeds[idx].name = e.target.value;
                          setPrescriptionForm({...prescriptionForm, medicines: newMeds});
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Dosage"
                          value={med.dosage}
                          onChange={(e) => {
                            const newMeds = [...prescriptionForm.medicines];
                            newMeds[idx].dosage = e.target.value;
                            setPrescriptionForm({...prescriptionForm, medicines: newMeds});
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Frequency"
                          value={med.frequency}
                          onChange={(e) => {
                            const newMeds = [...prescriptionForm.medicines];
                            newMeds[idx].frequency = e.target.value;
                            setPrescriptionForm({...prescriptionForm, medicines: newMeds});
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Duration"
                          value={med.duration}
                          onChange={(e) => {
                            const newMeds = [...prescriptionForm.medicines];
                            newMeds[idx].duration = e.target.value;
                            setPrescriptionForm({...prescriptionForm, medicines: newMeds});
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
                  >
                    + Add Medicine
                  </button>
                </div>
              )}

              {reviewForm.actionTaken === 'refer' && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-gray-800">Referral Details</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Referred To *</label>
                    <input
                      type="text"
                      required
                      value={referralForm.referredTo}
                      onChange={(e) => setReferralForm({...referralForm, referredTo: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      placeholder="Specialist or hospital name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Reason *</label>
                    <textarea
                      required
                      value={referralForm.reason}
                      onChange={(e) => setReferralForm({...referralForm, reason: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    resetForms();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors"
                >
                  Complete Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}