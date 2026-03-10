import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from './NotificationBell';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function NurseDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [pendingFollowUpCount, setPendingFollowUpCount] = useState(0);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);

  
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLabReviewModal, setShowLabReviewModal] = useState(false);

  
  const [labCompletedVisits, setLabCompletedVisits] = useState([]);
  const [selectedLabVisit, setSelectedLabVisit] = useState(null);
  const [labDecision, setLabDecision] = useState(''); 
  const [labTreatmentForm, setLabTreatmentForm] = useState({
    medicationGiven: '', dosage: '', instructions: '', treatmentNotes: ''
  });

  
  const [registerForm, setRegisterForm] = useState({
    fullName: '', studentId: '', grade: '', section: '', age: '', gender: 'Male',
    familyName: '', bloodGroup: 'Unknown',
    parentContact: {
      fatherName: '', fatherPhone: '', motherName: '', motherPhone: '',
      guardianName: '', guardianPhone: '', emergencyPhone: ''
    },
    allergies: '', chronicConditions: '', currentMedications: ''
  });

  
  const [visitForm, setVisitForm] = useState({
    chiefComplaint: '', symptoms: '',
    vitals: { temperature: '', bloodPressure: '', heartRate: '', weight: '', height: '', oxygenSaturation: '' },
    nurseAssessment: '', nurseNotes: '', severity: 'low', treatmentDecision: '',
    nurseTreatment: { medicationGiven: '', dosage: '', instructions: '', treatmentNotes: '' },
    labRequest: { testType: '', testDetails: '', urgency: 'Normal' }
  });

  
  const fetchStudents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/students/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.students || res.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setLoading(false);
    }
  }, []);

  
  const fetchLabCompletedVisits = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      try {
        const res = await axios.get(`${baseURL}/health-visits/nurse/lab-completed`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const visits = res.data.visits || res.data || [];
        setLabCompletedVisits(Array.isArray(visits) ? visits : []);
        setPendingFollowUpCount(Array.isArray(visits) ? visits.length : 0);
        return;
      } catch {}

      
      const res = await axios.get(`${baseURL}/health-visits/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const all = res.data.visits || res.data || [];
      const filtered = all.filter(v => v.status === 'lab_completed');
      setLabCompletedVisits(filtered);
      setPendingFollowUpCount(filtered.length);
    } catch (err) {
      console.error('Error fetching lab completed visits:', err);
    }
  }, []);

  const fetchPendingFollowUps = useCallback(async () => {
    
    fetchLabCompletedVisits();
  }, [fetchLabCompletedVisits]);

  const fetchStudentHistory = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/health-visits/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicalHistory(res.data.visits || []);
    } catch (err) {
      console.error('Error fetching student history:', err);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) { navigate('/'); return; }
    const userData = JSON.parse(userStr);
    if (userData.role !== 'nurse') { navigate('/'); return; }
    setUser(userData);
    fetchStudents();
    fetchLabCompletedVisits();

    const interval = setInterval(() => {
      fetchLabCompletedVisits();
    }, 20000);
    return () => clearInterval(interval);
  }, [navigate, fetchStudents, fetchLabCompletedVisits]);

  
  const handleNotificationClick = useCallback(async (notification) => {
    if (!notification.patientId) return;

    
    const token = localStorage.getItem('token');
    let freshVisits = [];
    try {
      const res = await axios.get(`${baseURL}/health-visits/nurse/lab-completed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      freshVisits = res.data.visits || res.data || [];
    } catch {
      try {
        const res = await axios.get(`${baseURL}/health-visits/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const all = res.data.visits || res.data || [];
        freshVisits = all.filter(v => v.status === 'lab_completed');
      } catch {}
    }

    setLabCompletedVisits(freshVisits);
    setPendingFollowUpCount(freshVisits.length);
    setActiveTab('lab-results');

   
    const match = freshVisits.find(v => v.studentId === notification.patientId);
    if (match) {
      setSelectedLabVisit(match);
      setLabDecision('');
      setLabTreatmentForm({ medicationGiven: '', dosage: '', instructions: '', treatmentNotes: '' });
      setShowLabReviewModal(true);
    }
  }, []);

  
  const handleLabFollowUp = async (e) => {
    e.preventDefault();
    if (!labDecision) { alert('Please choose what to do next'); return; }

    try {
      const token = localStorage.getItem('token');

      if (labDecision === 'treat') {
       
        await axios.put(
          `${baseURL}/health-visits/${selectedLabVisit._id}/nurse-lab-followup`,
          {
            nurseTreated: true,
            nurseTreatment: { ...labTreatmentForm, treatedAt: new Date() },
            status: 'nurse_treated',
            notifyPharmacist: true
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Student treated! Pharmacist has been notified.');
      } else {
       
        await axios.put(
          `${baseURL}/health-visits/${selectedLabVisit._id}/nurse-lab-followup`,
          {
            requiresDoctorReview: true,
            status: 'doctor_review'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Case escalated to doctor!');
      }

      setShowLabReviewModal(false);
      setSelectedLabVisit(null);
      setLabDecision('');
      await fetchLabCompletedVisits();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

 
  const handleSubmitVisit = async (e) => {
    e.preventDefault();
    if (!visitForm.treatmentDecision) { alert('Please select a treatment decision'); return; }
    try {
      const token = localStorage.getItem('token');
      const visitData = {
        studentId: selectedStudent.studentId,
        chiefComplaint: visitForm.chiefComplaint,
        symptoms: visitForm.symptoms,
        vitals: visitForm.vitals,
        nurseAssessment: visitForm.nurseAssessment,
        nurseNotes: visitForm.nurseNotes,
        severity: visitForm.severity
      };
      if (visitForm.treatmentDecision === 'treat') {
        visitData.nurseTreated = true;
        visitData.nurseTreatment = { ...visitForm.nurseTreatment, treatedAt: new Date() };
        visitData.status = 'nurse_treated';
      } else if (visitForm.treatmentDecision === 'lab') {
        visitData.requiresLab = true;
        visitData.labRequest = { ...visitForm.labRequest, requestedAt: new Date() };
        visitData.status = 'lab_pending';
      } else if (visitForm.treatmentDecision === 'doctor') {
        visitData.requiresDoctorReview = true;
        visitData.status = 'doctor_review';
      }
      await axios.post(`${baseURL}/health-visits/`, visitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const message =
        visitForm.treatmentDecision === 'treat' ? 'Visit recorded and student treated!' :
        visitForm.treatmentDecision === 'lab' ? 'Visit recorded! Lab technician has been notified.' :
        'Visit recorded! Doctor has been notified.';
      alert(message);
      setShowVisitModal(false);
      resetVisitForm();
      await fetchStudentHistory(selectedStudent.studentId);
      await fetchLabCompletedVisits();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${baseURL}/students`, registerForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Student registered successfully!');
      setShowRegisterModal(false);
      resetRegisterForm();
      await fetchStudents();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  
  const resetRegisterForm = () => setRegisterForm({
    fullName: '', studentId: '', grade: '', section: '', age: '', gender: 'Male',
    familyName: '', bloodGroup: 'Unknown',
    parentContact: { fatherName: '', fatherPhone: '', motherName: '', motherPhone: '', guardianName: '', guardianPhone: '', emergencyPhone: '' },
    allergies: '', chronicConditions: '', currentMedications: ''
  });

  const resetVisitForm = () => setVisitForm({
    chiefComplaint: '', symptoms: '',
    vitals: { temperature: '', bloodPressure: '', heartRate: '', weight: '', height: '', oxygenSaturation: '' },
    nurseAssessment: '', nurseNotes: '', severity: 'low', treatmentDecision: '',
    nurseTreatment: { medicationGiven: '', dosage: '', instructions: '', treatmentNotes: '' },
    labRequest: { testType: '', testDetails: '', urgency: 'Normal' }
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const map = {
      nurse_treated: 'bg-green-100 text-green-800 border-green-300',
      lab_pending: 'bg-orange-100 text-orange-800 border-orange-300',
      lab_completed: 'bg-blue-100 text-blue-800 border-blue-300',
      doctor_review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      referred: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return map[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const filteredStudents = students.filter(s =>
    s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.familyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

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
    <div className="min-h-screen bg-white font-['Poppins']">

      
      <div className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Nurse Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              
              <NotificationBell onNotificationClick={handleNotificationClick} />

              
              {labCompletedVisits.length > 0 && (
                <button
                  onClick={() => setActiveTab('lab-results')}
                  className="px-2 py-1 bg-blue-50 border border-blue-300 hover:bg-blue-100 transition-colors"
                >
                  <p className="text-xs text-blue-700 font-semibold">
                    🔬 Lab Results: {labCompletedVisits.length}
                  </p>
                </button>
              )}

              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
              >
                + Register Student
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        
        <div className="bg-white border border-gray-300 inline-flex mb-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 font-semibold transition-all text-sm ${activeTab === 'students' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            All Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('lab-results')}
            className={`px-6 py-3 font-semibold transition-all text-sm border-l border-gray-300 ${activeTab === 'lab-results' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Lab Results
            {labCompletedVisits.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-blue-600 text-white">
                {labCompletedVisits.length}
              </span>
            )}
          </button>
        </div>

        
        {activeTab === 'students' && (
          <>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by name, student ID, or family name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
              />
            </div>

            <div className="bg-white border border-gray-300">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Student ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Full Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Age</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Blood Group</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentStudents.length === 0 ? (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">No students found</td></tr>
                  ) : currentStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{student.studentId}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{student.fullName}</span>
                          {student.allergies && (
                            <span className="text-xs text-red-600 mt-1">⚠️ Allergies: {student.allergies}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.grade}{student.section && `-${student.section}`}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.age}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.gender}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.bloodGroup}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => { setSelectedStudent(student); fetchStudentHistory(student.studentId); setShowDetailsModal(true); }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => { setSelectedStudent(student); setShowVisitModal(true); }}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                        >
                          Record Visit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length} students
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border border-gray-300 disabled:opacity-50 hover:bg-gray-50">Previous</button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 text-sm border ${currentPage === i + 1 ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-50'}`}>{i + 1}</button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border border-gray-300 disabled:opacity-50 hover:bg-gray-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        
        {activeTab === 'lab-results' && (
          <div className="bg-white border border-gray-300">
            {labCompletedVisits.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <p className="text-sm text-gray-500">No lab results awaiting your action</p>
                <p className="text-xs text-gray-400 mt-1">Refreshes automatically every 20 seconds</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {labCompletedVisits.map((visit) => (
                  <div key={visit._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {visit.studentName || visit.studentId}
                        </h3>
                        <p className="text-sm text-gray-600">ID: {visit.studentId} • Grade {visit.grade}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(visit.createdAt).toLocaleDateString()} • {visit.labRequest?.testType}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLabVisit(visit);
                          setLabDecision('');
                          setLabTreatmentForm({ medicationGiven: '', dosage: '', instructions: '', treatmentNotes: '' });
                          setShowLabReviewModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                      >
                        Review &amp; Act
                      </button>
                    </div>

                    
                    <div className="bg-gray-50 border border-gray-300 p-3 mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Chief Complaint</p>
                      <p className="text-sm text-gray-900">{visit.chiefComplaint}</p>
                    </div>

                    
                    {visit.labResults && (
                      <div className="bg-purple-50 border border-purple-300 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs font-semibold text-purple-900">🔬 Lab Results</p>
                          {visit.labResults.criticalValues && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold">CRITICAL</span>
                          )}
                          {visit.labResults.abnormalFindings && !visit.labResults.criticalValues && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-semibold border border-orange-300">ABNORMAL</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 line-clamp-2">{visit.labResults.results}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

     
      {showLabReviewModal && selectedLabVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 sticky top-0 bg-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Lab Results Review</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {selectedLabVisit.studentName || selectedLabVisit.studentId} &bull; {selectedLabVisit.labRequest?.testType}
                </p>
              </div>
              <button
                onClick={() => { setShowLabReviewModal(false); setSelectedLabVisit(null); }}
                className="text-gray-500 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-gray-300 p-3">
                  <p className="text-xs text-gray-600 mb-1">Age</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedLabVisit.age} yrs</p>
                </div>
                <div className="border border-gray-300 p-3">
                  <p className="text-xs text-gray-600 mb-1">Grade</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedLabVisit.grade}</p>
                </div>
                <div className="border border-gray-300 p-3">
                  <p className="text-xs text-gray-600 mb-1">Severity</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{selectedLabVisit.severity}</p>
                </div>
              </div>

              {selectedLabVisit.allergies && (
                <div className="bg-red-50 border border-red-300 p-3">
                  <p className="text-sm font-semibold text-red-900">⚠️ Allergies: {selectedLabVisit.allergies}</p>
                </div>
              )}

              
              <div className="border border-gray-300 p-4">
                <p className="text-xs font-semibold text-gray-600 mb-1">Chief Complaint</p>
                <p className="text-sm text-gray-900">{selectedLabVisit.chiefComplaint}</p>
                {selectedLabVisit.symptoms && (
                  <p className="text-xs text-gray-500 mt-1">{selectedLabVisit.symptoms}</p>
                )}
              </div>

              
              {selectedLabVisit.labResults && (
                <div className="bg-purple-50 border border-purple-300 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-purple-900">🔬 Lab Results</p>
                    {selectedLabVisit.labResults.criticalValues && (
                      <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold">CRITICAL</span>
                    )}
                    {selectedLabVisit.labResults.abnormalFindings && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-semibold border border-orange-300">ABNORMAL</span>
                    )}
                  </div>
                  <div className="bg-white border border-purple-200 p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Results</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedLabVisit.labResults.results}</p>
                  </div>
                  {selectedLabVisit.labResults.findings && (
                    <div className="bg-white border border-purple-200 p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Findings</p>
                      <p className="text-sm text-gray-900">{selectedLabVisit.labResults.findings}</p>
                    </div>
                  )}
                  {selectedLabVisit.labResults.interpretation && (
                    <div className="bg-white border border-purple-200 p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Interpretation</p>
                      <p className="text-sm text-gray-900">{selectedLabVisit.labResults.interpretation}</p>
                    </div>
                  )}
                </div>
              )}

              
              <form onSubmit={handleLabFollowUp} className="space-y-4 border-t border-gray-300 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  What would you like to do? *
                </h3>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-4 border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio" name="labDecision" value="treat"
                      checked={labDecision === 'treat'}
                      onChange={() => setLabDecision('treat')}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">💊 Treat the Student</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Administer medication based on the results — pharmacist will be notified to prepare the prescription
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio" name="labDecision" value="doctor"
                      checked={labDecision === 'doctor'}
                      onChange={() => setLabDecision('doctor')}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">👨‍⚕️ Escalate to Doctor</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Forward the lab results for a doctor's evaluation — doctor will be notified immediately
                      </p>
                    </div>
                  </label>
                </div>

                
                {labDecision === 'treat' && (
                  <div className="bg-gray-50 border border-gray-300 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Treatment Details</h4>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Medication Given *</label>
                      <input
                        type="text" required
                        value={labTreatmentForm.medicationGiven}
                        onChange={(e) => setLabTreatmentForm({ ...labTreatmentForm, medicationGiven: e.target.value })}
                        placeholder="e.g. Paracetamol 500mg"
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Dosage</label>
                        <input
                          type="text"
                          value={labTreatmentForm.dosage}
                          onChange={(e) => setLabTreatmentForm({ ...labTreatmentForm, dosage: e.target.value })}
                          placeholder="e.g. 1 tablet"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Instructions</label>
                        <input
                          type="text"
                          value={labTreatmentForm.instructions}
                          onChange={(e) => setLabTreatmentForm({ ...labTreatmentForm, instructions: e.target.value })}
                          placeholder="e.g. After meals"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Treatment Notes</label>
                      <textarea
                        rows={2}
                        value={labTreatmentForm.treatmentNotes}
                        onChange={(e) => setLabTreatmentForm({ ...labTreatmentForm, treatmentNotes: e.target.value })}
                        placeholder="Any additional notes..."
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => { setShowLabReviewModal(false); setSelectedLabVisit(null); }}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium"
                  >
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

     
      {showDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Student Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-600 mb-1">Full Name</label><p className="text-sm font-medium text-gray-900">{selectedStudent.fullName}</p></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Student ID</label><p className="text-sm font-medium text-gray-900">{selectedStudent.studentId}</p></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Grade/Section</label><p className="text-sm font-medium text-gray-900">{selectedStudent.grade}{selectedStudent.section && `-${selectedStudent.section}`}</p></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Age</label><p className="text-sm font-medium text-gray-900">{selectedStudent.age} years</p></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Gender</label><p className="text-sm font-medium text-gray-900">{selectedStudent.gender}</p></div>
                  <div><label className="block text-xs text-gray-600 mb-1">Blood Group</label><p className="text-sm font-medium text-gray-900">{selectedStudent.bloodGroup}</p></div>
                </div>
              </div>
              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Medical Information</h3>
                <div className="space-y-3">
                  {selectedStudent.allergies && <div className="border border-red-300 bg-red-50 p-4"><label className="block text-xs text-red-900 font-semibold mb-1">Allergies</label><p className="text-sm text-red-900">{selectedStudent.allergies}</p></div>}
                  {selectedStudent.chronicConditions && <div className="border border-gray-300 p-4"><label className="block text-xs text-gray-600 font-semibold mb-1">Chronic Conditions</label><p className="text-sm text-gray-900">{selectedStudent.chronicConditions}</p></div>}
                  {selectedStudent.currentMedications && <div className="border border-gray-300 p-4"><label className="block text-xs text-gray-600 font-semibold mb-1">Current Medications</label><p className="text-sm text-gray-900">{selectedStudent.currentMedications}</p></div>}
                </div>
              </div>
              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Health Visit History</h3>
                {medicalHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No health visits recorded</p>
                ) : (
                  <div className="space-y-3">
                    {medicalHistory.map((visit) => (
                      <div key={visit._id} className="border border-gray-300 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{visit.chiefComplaint}</p>
                            <p className="text-xs text-gray-600 mt-1">{visit.symptoms}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 text-xs font-medium border ${getStatusBadge(visit.status)}`}>
                              {visit.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{new Date(visit.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {visit.nurseTreated && visit.nurseTreatment && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600"><span className="font-semibold">Treatment:</span> {visit.nurseTreatment.medicationGiven}</p>
                          </div>
                        )}
                        {visit.labResults && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600"><span className="font-semibold">Lab Results:</span> {visit.labResults.results}</p>
                          </div>
                        )}
                        {visit.doctorDiagnosis && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600"><span className="font-semibold">Doctor Diagnosis:</span> {visit.doctorDiagnosis}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Register New Student</h2>
              <button onClick={() => { setShowRegisterModal(false); resetRegisterForm(); }} className="text-gray-500 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleRegisterStudent} className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-600 mb-2">Full Name *</label><input type="text" required value={registerForm.fullName} onChange={(e) => setRegisterForm({...registerForm, fullName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Student ID *</label><input type="text" required value={registerForm.studentId} onChange={(e) => setRegisterForm({...registerForm, studentId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Grade *</label><input type="text" required value={registerForm.grade} onChange={(e) => setRegisterForm({...registerForm, grade: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Section</label><input type="text" value={registerForm.section} onChange={(e) => setRegisterForm({...registerForm, section: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Age *</label><input type="number" required value={registerForm.age} onChange={(e) => setRegisterForm({...registerForm, age: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Gender *</label><select required value={registerForm.gender} onChange={(e) => setRegisterForm({...registerForm, gender: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"><option value="Male">Male</option><option value="Female">Female</option></select></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Family Name *</label><input type="text" required value={registerForm.familyName} onChange={(e) => setRegisterForm({...registerForm, familyName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Blood Group</label><select value={registerForm.bloodGroup} onChange={(e) => setRegisterForm({...registerForm, bloodGroup: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"><option value="Unknown">Unknown</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option></select></div>
                </div>
              </div>
              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-600 mb-2">Father's Name</label><input type="text" value={registerForm.parentContact.fatherName} onChange={(e) => setRegisterForm({...registerForm, parentContact: {...registerForm.parentContact, fatherName: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Father's Phone</label><input type="tel" value={registerForm.parentContact.fatherPhone} onChange={(e) => setRegisterForm({...registerForm, parentContact: {...registerForm.parentContact, fatherPhone: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Mother's Name</label><input type="text" value={registerForm.parentContact.motherName} onChange={(e) => setRegisterForm({...registerForm, parentContact: {...registerForm.parentContact, motherName: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Mother's Phone</label><input type="tel" value={registerForm.parentContact.motherPhone} onChange={(e) => setRegisterForm({...registerForm, parentContact: {...registerForm.parentContact, motherPhone: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div className="col-span-2"><label className="block text-xs text-gray-600 mb-2">Emergency Phone *</label><input type="tel" required value={registerForm.parentContact.emergencyPhone} onChange={(e) => setRegisterForm({...registerForm, parentContact: {...registerForm.parentContact, emergencyPhone: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                </div>
              </div>
              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Medical Information</h3>
                <div className="space-y-4">
                  <div><label className="block text-xs text-gray-600 mb-2">Known Allergies</label><textarea value={registerForm.allergies} onChange={(e) => setRegisterForm({...registerForm, allergies: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" rows={2} /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Chronic Conditions</label><textarea value={registerForm.chronicConditions} onChange={(e) => setRegisterForm({...registerForm, chronicConditions: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" rows={2} /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Current Medications</label><textarea value={registerForm.currentMedications} onChange={(e) => setRegisterForm({...registerForm, currentMedications: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" rows={2} /></div>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-300">
                <button type="button" onClick={() => { setShowRegisterModal(false); resetRegisterForm(); }} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium">Register Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

     
      {showVisitModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Record Health Visit</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedStudent.fullName} • {selectedStudent.studentId}</p>
              </div>
              <button onClick={() => { setShowVisitModal(false); resetVisitForm(); }} className="text-gray-500 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmitVisit} className="p-6 space-y-6">
              <div><label className="block text-xs text-gray-600 mb-2">Chief Complaint *</label><input type="text" required value={visitForm.chiefComplaint} onChange={(e) => setVisitForm({...visitForm, chiefComplaint: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
              <div><label className="block text-xs text-gray-600 mb-2">Symptoms *</label><textarea required value={visitForm.symptoms} onChange={(e) => setVisitForm({...visitForm, symptoms: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" rows={3} /></div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-3">Vital Signs</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs text-gray-600 mb-2">Temperature</label><input type="text" value={visitForm.vitals.temperature} onChange={(e) => setVisitForm({...visitForm, vitals: {...visitForm.vitals, temperature: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Blood Pressure</label><input type="text" value={visitForm.vitals.bloodPressure} onChange={(e) => setVisitForm({...visitForm, vitals: {...visitForm.vitals, bloodPressure: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Heart Rate</label><input type="text" value={visitForm.vitals.heartRate} onChange={(e) => setVisitForm({...visitForm, vitals: {...visitForm.vitals, heartRate: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                </div>
              </div>
              <div><label className="block text-xs text-gray-600 mb-2">Nurse Assessment</label><textarea value={visitForm.nurseAssessment} onChange={(e) => setVisitForm({...visitForm, nurseAssessment: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" rows={2} /></div>
              <div><label className="block text-xs text-gray-600 mb-2">Severity</label><select value={visitForm.severity} onChange={(e) => setVisitForm({...visitForm, severity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-3">Treatment Decision *</h3>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border border-gray-300 cursor-pointer hover:bg-gray-50"><input type="radio" name="treatmentDecision" value="treat" checked={visitForm.treatmentDecision === 'treat'} onChange={(e) => setVisitForm({...visitForm, treatmentDecision: e.target.value})} className="mt-0.5" /><div><p className="text-sm font-medium text-gray-900">Treat Student</p><p className="text-xs text-gray-600">Provide medication and mark as treated</p></div></label>
                  <label className="flex items-start gap-3 p-3 border border-gray-300 cursor-pointer hover:bg-gray-50"><input type="radio" name="treatmentDecision" value="lab" checked={visitForm.treatmentDecision === 'lab'} onChange={(e) => setVisitForm({...visitForm, treatmentDecision: e.target.value})} className="mt-0.5" /><div><p className="text-sm font-medium text-gray-900">Send to Lab</p><p className="text-xs text-gray-600">Request laboratory tests — lab technician will be notified</p></div></label>
                  <label className="flex items-start gap-3 p-3 border border-gray-300 cursor-pointer hover:bg-gray-50"><input type="radio" name="treatmentDecision" value="doctor" checked={visitForm.treatmentDecision === 'doctor'} onChange={(e) => setVisitForm({...visitForm, treatmentDecision: e.target.value})} className="mt-0.5" /><div><p className="text-sm font-medium text-gray-900">Send to Doctor</p><p className="text-xs text-gray-600">Requires doctor's review — doctor will be notified</p></div></label>
                </div>
              </div>
              {visitForm.treatmentDecision === 'treat' && (
                <div className="bg-gray-50 border border-gray-300 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Treatment Details</h4>
                  <div><label className="block text-xs text-gray-600 mb-2">Medication Given *</label><input type="text" required value={visitForm.nurseTreatment.medicationGiven} onChange={(e) => setVisitForm({...visitForm, nurseTreatment: {...visitForm.nurseTreatment, medicationGiven: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-600 mb-2">Dosage</label><input type="text" value={visitForm.nurseTreatment.dosage} onChange={(e) => setVisitForm({...visitForm, nurseTreatment: {...visitForm.nurseTreatment, dosage: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                    <div><label className="block text-xs text-gray-600 mb-2">Instructions</label><input type="text" value={visitForm.nurseTreatment.instructions} onChange={(e) => setVisitForm({...visitForm, nurseTreatment: {...visitForm.nurseTreatment, instructions: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
                  </div>
                </div>
              )}
              {visitForm.treatmentDecision === 'lab' && (
                <div className="bg-gray-50 border border-gray-300 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Lab Test Request</h4>
                  <div><label className="block text-xs text-gray-600 mb-2">Test Type *</label><select required value={visitForm.labRequest.testType} onChange={(e) => setVisitForm({...visitForm, labRequest: {...visitForm.labRequest, testType: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"><option value="">Select test type</option><option value="Blood Test">Blood Test</option><option value="Urine Test">Urine Test</option><option value="Vision Test">Vision Test</option><option value="Hearing Test">Hearing Test</option><option value="Other">Other</option></select></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Test Details</label><textarea value={visitForm.labRequest.testDetails} onChange={(e) => setVisitForm({...visitForm, labRequest: {...visitForm.labRequest, testDetails: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" rows={2} /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Urgency</label><select value={visitForm.labRequest.urgency} onChange={(e) => setVisitForm({...visitForm, labRequest: {...visitForm.labRequest, urgency: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"><option value="Normal">Normal</option><option value="Urgent">Urgent</option><option value="Emergency">Emergency</option></select></div>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-gray-300">
                <button type="button" onClick={() => { setShowVisitModal(false); resetVisitForm(); }} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium">Record Visit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}