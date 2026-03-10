import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from './NotificationBell';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [healthVisits, setHealthVisits] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(true);

  
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    date: '', time: '', notes: ''
  });

  const [reviewForm, setReviewForm] = useState({
    doctorDiagnosis: '', doctorTreatment: '', doctorNotes: '', actionTaken: '',
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    notes: ''
  });

  const [referralForm, setReferralForm] = useState({ referredTo: '', reason: '' });

 
  const fetchPendingReviews = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/health-visits/doctor/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const visits = Array.isArray(res.data) ? res.data : (res.data?.visits || []);
      setPendingReviews(visits);
      return visits; 
    } catch (err) {
      console.error('Error fetching pending reviews:', err);
      setPendingReviews([]);
      return [];
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data.students || res.data || [];
      setStudents(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) { navigate('/'); return; }
    const userData = JSON.parse(userStr);
    if (userData.role !== 'doctor') { navigate('/'); return; }
    setUser(userData);
    fetchPendingReviews();
    fetchStudents();

    
    const interval = setInterval(fetchPendingReviews, 30000);
    return () => clearInterval(interval);
  }, [navigate, fetchPendingReviews, fetchStudents]);

  const fetchStudentHistory = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/health-visits/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHealthVisits(Array.isArray(res.data) ? res.data : (res.data?.visits || []));
    } catch (err) {
      console.error('Error fetching student history:', err);
      setHealthVisits([]);
    }
  };


  const handleNotificationClick = async (notification) => {
    if (!notification.patientId) return;

    setActiveTab('pending');

   
    const freshReviews = await fetchPendingReviews();

    
    if (notification.visitId) {
      const visitIdStr = notification.visitId?.toString();
      const exactVisit = freshReviews.find(v => v._id?.toString() === visitIdStr);
      if (exactVisit) {
        setSelectedVisit(exactVisit);
        return;
      }
    }

    
    const studentVisits = freshReviews.filter(v => v.studentId === notification.patientId);
    if (studentVisits.length > 0) {
      const mostRecent = studentVisits.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];
      setSelectedVisit(mostRecent);
      return;
    }

    
    const matchedStudent = students.find(s => s.studentId === notification.patientId);
    if (matchedStudent) {
      handleStudentSelect(matchedStudent);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    fetchStudentHistory(student.studentId);
    setShowDetailsModal(true);
  };

  const handleVisitSelect = (visit) => setSelectedVisit(visit);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.actionTaken) { alert('Please select an action'); return; }
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
        reviewData.referralDetails = { ...referralForm, referredAt: new Date() };
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
      setSelectedVisit(null);
      resetForms();
      await fetchPendingReviews();
      if (selectedStudent) fetchStudentHistory(selectedStudent.studentId);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    if (!selectedVisit && !selectedStudent) return;
    try {
      const token = localStorage.getItem('token');
      const studentId = selectedVisit?.studentId || selectedStudent?.studentId;
      
      if (selectedVisit) {
        await axios.put(`${baseURL}/health-visits/${selectedVisit._id}`, {
          followUpRequired: true,
          followUpDate: new Date(`${appointmentForm.date}T${appointmentForm.time}`),
          followUpNotes: appointmentForm.notes,
          status: 'completed'
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      alert(`Appointment scheduled for ${appointmentForm.date} at ${appointmentForm.time}`);
      setShowAppointmentModal(false);
      setAppointmentForm({ date: '', time: '', notes: '' });
      setSelectedVisit(null);
      await fetchPendingReviews();
    } catch (err) {
      alert('Error scheduling: ' + (err.response?.data?.message || err.message));
    }
  };

  const addMedicine = () => setPrescriptionForm({
    ...prescriptionForm,
    medicines: [...prescriptionForm.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  });

  const removeMedicine = (index) => setPrescriptionForm({
    ...prescriptionForm,
    medicines: prescriptionForm.medicines.filter((_, i) => i !== index)
  });

  const resetForms = () => {
    setReviewForm({ doctorDiagnosis: '', doctorTreatment: '', doctorNotes: '', actionTaken: '' });
    setPrescriptionForm({ medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }], notes: '' });
    setReferralForm({ referredTo: '', reason: '' });
    setSelectedVisit(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredStudents = students.filter(student =>
    student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.familyName?.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="min-h-screen bg-gray-50 font-['Poppins']">
     
      <div className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Doctor Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, Dr. {user?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              
              <NotificationBell onNotificationClick={handleNotificationClick} />
              <div className="px-2 py-1 bg-red-50 border border-red-200">
                <p className="text-xs text-red-700 font-semibold">Pending: {pendingReviews.length}</p>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
       
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600 uppercase tracking-wide">Total Patients</p><p className="text-2xl font-bold text-gray-900 mt-1">{students.length}</p></div>
              <div className="bg-blue-50 p-3"><svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
            </div>
          </div>
          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600 uppercase tracking-wide">Pending Reviews</p><p className="text-2xl font-bold text-gray-900 mt-1">{pendingReviews.length}</p></div>
              <div className="bg-orange-50 p-3"><svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
          </div>
          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600 uppercase tracking-wide">Critical Cases</p><p className="text-2xl font-bold text-gray-900 mt-1">{pendingReviews.filter(v => v.severity === 'high' || v.labResults?.criticalValues).length}</p></div>
              <div className="bg-red-50 p-3"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
            </div>
          </div>
          <div className="bg-white border border-gray-300 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-gray-600 uppercase tracking-wide">With Allergies</p><p className="text-2xl font-bold text-gray-900 mt-1">{students.filter(s => s.allergies).length}</p></div>
              <div className="bg-yellow-50 p-3"><svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
          </div>
        </div>

        
        <div className="bg-white border border-gray-300 inline-flex mb-6">
          <button onClick={() => setActiveTab('pending')} className={`px-6 py-3 font-semibold transition-all text-sm ${activeTab === 'pending' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            Pending Reviews ({pendingReviews.length})
          </button>
          <button onClick={() => setActiveTab('patients')} className={`px-6 py-3 font-semibold transition-all text-sm border-l border-gray-300 ${activeTab === 'patients' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            All Patients ({students.length})
          </button>
        </div>

        
        {activeTab === 'pending' ? (
          <div className="grid grid-cols-12 gap-6">
           
            <div className="col-span-5 bg-white border border-gray-300 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cases Requiring Review</h2>
              <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                {pendingReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-gray-500">No pending reviews</p>
                  </div>
                ) : (
                  pendingReviews.map((visit) => (
                    <button key={visit._id} onClick={() => handleVisitSelect(visit)} className={`w-full text-left p-4 transition-all ${selectedVisit?._id === visit._id ? 'bg-gray-50 border-2 border-gray-900' : 'bg-white hover:bg-gray-50 border-2 border-gray-300'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-gray-900">{visit.studentName}</h3>
                          <p className="text-xs text-gray-600">ID: {visit.studentId} • Grade {visit.grade}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {visit.severity === 'high' && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold">HIGH</span>}
                          {visit.labResults?.criticalValues && <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold">CRITICAL</span>}
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-300 p-3 mb-2">
                        <p className="text-xs font-semibold text-gray-600">Chief Complaint</p>
                        <p className="text-sm text-gray-900">{visit.chiefComplaint}</p>
                      </div>
                      {visit.requiresLab && visit.labResults && (
                        <div className="bg-purple-50 border border-purple-300 p-2">
                          <p className="text-xs font-semibold text-purple-900">Lab Results Available</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                        <span className="text-xs text-gray-500">Visit: {visit.visitNumber}</span>
                        <span className="text-xs text-gray-500">{new Date(visit.createdAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            
            <div className="col-span-7">
              {selectedVisit ? (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-300 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{selectedVisit.studentName}</h2>
                        <p className="text-sm text-gray-600">Student ID: {selectedVisit.studentId} • Grade {selectedVisit.grade}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowAppointmentModal(true)}
                          className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium transition-colors"
                        >
                          Schedule
                        </button>
                        <button
                          onClick={() => setShowReviewModal(true)}
                          className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
                        >
                          Review & Treat
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="border border-gray-300 p-3"><p className="text-xs text-gray-600 mb-1">Age</p><p className="text-sm font-semibold text-gray-900">{selectedVisit.age} yrs</p></div>
                      <div className="border border-gray-300 p-3"><p className="text-xs text-gray-600 mb-1">Gender</p><p className="text-sm font-semibold text-gray-900">{selectedVisit.gender}</p></div>
                      <div className="border border-gray-300 p-3"><p className="text-xs text-gray-600 mb-1">Blood Group</p><p className="text-sm font-semibold text-gray-900">{selectedVisit.bloodGroup || 'N/A'}</p></div>
                      <div className="border border-gray-300 p-3"><p className="text-xs text-gray-600 mb-1">Severity</p><p className="text-sm font-semibold text-gray-900 capitalize">{selectedVisit.severity}</p></div>
                    </div>
                    {selectedVisit.allergies && <div className="bg-red-50 border border-red-300 p-4 mb-4"><p className="text-sm font-semibold text-red-900">⚠️ Allergies: {selectedVisit.allergies}</p></div>}
                    {selectedVisit.chronicConditions && <div className="bg-yellow-50 border border-yellow-300 p-4"><p className="text-sm font-semibold text-yellow-900">Chronic: {selectedVisit.chronicConditions}</p></div>}
                  </div>

                  <div className="bg-white border border-gray-300 p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Visit Information</h3>
                    <div className="space-y-3">
                      <div className="bg-gray-50 border border-gray-300 p-4"><p className="text-xs font-semibold text-gray-600 mb-1">Chief Complaint</p><p className="text-sm text-gray-900">{selectedVisit.chiefComplaint}</p></div>
                      <div className="border border-gray-300 p-4"><p className="text-xs font-semibold text-gray-600 mb-1">Symptoms</p><p className="text-sm text-gray-900">{selectedVisit.symptoms}</p></div>
                      {selectedVisit.nurseAssessment && <div className="border border-gray-300 p-4"><p className="text-xs font-semibold text-gray-600 mb-1">Nurse Assessment</p><p className="text-sm text-gray-900">{selectedVisit.nurseAssessment}</p></div>}
                      {selectedVisit.vitals && (
                        <div className="border border-gray-300 p-4">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Vital Signs</p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {selectedVisit.vitals.temperature && <div><span className="font-medium">Temp:</span> {selectedVisit.vitals.temperature}</div>}
                            {selectedVisit.vitals.bloodPressure && <div><span className="font-medium">BP:</span> {selectedVisit.vitals.bloodPressure}</div>}
                            {selectedVisit.vitals.heartRate && <div><span className="font-medium">HR:</span> {selectedVisit.vitals.heartRate}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedVisit.labResults && (
                    <div className="bg-white border border-gray-300 p-5">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Laboratory Results</h3>
                      <div className="space-y-3">
                        <div className="bg-purple-50 border border-purple-300 p-4"><p className="text-xs font-semibold text-gray-600 mb-1">Results</p><p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedVisit.labResults.results}</p></div>
                        {selectedVisit.labResults.findings && <div className="border border-gray-300 p-4"><p className="text-xs font-semibold text-gray-600 mb-1">Findings</p><p className="text-sm text-gray-900">{selectedVisit.labResults.findings}</p></div>}
                        {selectedVisit.labResults.interpretation && <div className="border border-gray-300 p-4"><p className="text-xs font-semibold text-gray-600 mb-1">Interpretation</p><p className="text-sm text-gray-900">{selectedVisit.labResults.interpretation}</p></div>}
                        <div className="flex gap-2">
                          {selectedVisit.labResults.abnormalFindings && <div className="flex-1 bg-orange-50 border border-orange-300 p-3 text-center"><p className="text-xs font-semibold text-orange-900">⚠️ Abnormal</p></div>}
                          {selectedVisit.labResults.criticalValues && <div className="flex-1 bg-red-50 border border-red-300 p-3 text-center"><p className="text-xs font-semibold text-red-900">🚨 Critical</p></div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-gray-300 p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-gray-500 font-medium">Select a case to review</p>
                  <p className="text-gray-400 text-xs mt-1">Or click a notification to jump directly to a patient</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          
          <div>
            <div className="mb-6">
              <input type="text" placeholder="Search by name, student ID, or family name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" />
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
                      <td className="px-6 py-4"><div className="flex flex-col"><span className="text-sm font-medium text-gray-900">{student.fullName}</span>{student.allergies && <span className="text-xs text-red-600 mt-1">⚠️ Allergies: {student.allergies}</span>}</div></td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.grade}{student.section && `-${student.section}`}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.age}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.gender}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.bloodGroup}</td>
                      <td className="px-6 py-4 text-right"><button onClick={() => handleStudentSelect(student)} className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors">View History</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Showing {indexOfFirstStudent + 1}–{Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length}</div>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border border-gray-300 disabled:opacity-50 hover:bg-gray-50">Previous</button>
                    {[...Array(totalPages)].map((_, i) => (<button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 text-sm border ${currentPage === i + 1 ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-50'}`}>{i + 1}</button>))}
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border border-gray-300 disabled:opacity-50 hover:bg-gray-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      
      {showDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Patient Details — {selectedStudent.fullName}</h2>
              <button onClick={() => { setShowDetailsModal(false); setSelectedStudent(null); }} className="text-gray-500 hover:text-gray-900">
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
                  <div><label className="block text-xs text-gray-600 mb-1">Blood Group</label><p className="text-sm font-medium text-gray-900">{selectedStudent.bloodGroup || 'Unknown'}</p></div>
                </div>
              </div>
              {selectedStudent.parentContact && (
                <div className="border-t border-gray-300 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedStudent.parentContact.fatherName && <div><label className="block text-xs text-gray-600 mb-1">Father</label><p className="text-sm font-medium text-gray-900">{selectedStudent.parentContact.fatherName}</p></div>}
                    {selectedStudent.parentContact.fatherPhone && <div><label className="block text-xs text-gray-600 mb-1">Father's Phone</label><p className="text-sm font-medium text-gray-900">{selectedStudent.parentContact.fatherPhone}</p></div>}
                    {selectedStudent.parentContact.motherName && <div><label className="block text-xs text-gray-600 mb-1">Mother</label><p className="text-sm font-medium text-gray-900">{selectedStudent.parentContact.motherName}</p></div>}
                    {selectedStudent.parentContact.motherPhone && <div><label className="block text-xs text-gray-600 mb-1">Mother's Phone</label><p className="text-sm font-medium text-gray-900">{selectedStudent.parentContact.motherPhone}</p></div>}
                    {selectedStudent.parentContact.emergencyPhone && <div className="col-span-2"><label className="block text-xs text-gray-600 mb-1">Emergency Phone</label><p className="text-sm font-medium text-gray-900">{selectedStudent.parentContact.emergencyPhone}</p></div>}
                  </div>
                </div>
              )}
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
                {healthVisits.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No health visits recorded</p>
                ) : (
                  <div className="space-y-3">
                    {healthVisits.map((visit) => (
                      <div key={visit._id} className="border border-gray-300 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div><p className="text-sm font-semibold text-gray-900">{visit.chiefComplaint || 'Not specified'}</p><p className="text-xs text-gray-600 mt-1">{visit.symptoms || 'No symptoms recorded'}</p></div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-1 text-xs font-medium border border-gray-300">{visit.status ? visit.status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN'}</span>
                            <p className="text-xs text-gray-500 mt-1">{visit.createdAt ? new Date(visit.createdAt).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        {visit.doctorDiagnosis && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600"><span className="font-semibold">Diagnosis:</span> {visit.doctorDiagnosis}</p>
                            {visit.doctorTreatment && <p className="text-xs text-gray-600 mt-1"><span className="font-semibold">Treatment:</span> {visit.doctorTreatment}</p>}
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

      
      {showReviewModal && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Doctor's Review</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedVisit.studentName} • Visit {selectedVisit.visitNumber}</p>
            </div>
            <form onSubmit={handleReview} className="p-6 space-y-4">
              <div><label className="block text-xs text-gray-600 mb-2">Diagnosis *</label><input type="text" required value={reviewForm.doctorDiagnosis} onChange={(e) => setReviewForm({...reviewForm, doctorDiagnosis: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" /></div>
              <div><label className="block text-xs text-gray-600 mb-2">Treatment Plan *</label><textarea required value={reviewForm.doctorTreatment} onChange={(e) => setReviewForm({...reviewForm, doctorTreatment: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" rows={3} /></div>
              <div><label className="block text-xs text-gray-600 mb-2">Notes</label><textarea value={reviewForm.doctorNotes} onChange={(e) => setReviewForm({...reviewForm, doctorNotes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" rows={2} /></div>

              
              <div className="border-t border-gray-300 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-3">Action Required *</h3>
                <div className="space-y-2">
                  {[
                    { value: 'treat', label: 'Complete Treatment', desc: 'Student can return to class' },
                    { value: 'prescribe', label: 'Prescribe Medication', desc: 'Issue prescription → pharmacist notified' },
                    { value: 'refer', label: 'Refer to Specialist', desc: 'External referral required' },
                    { value: 'hospitalize', label: 'Hospitalize', desc: 'Requires immediate admission' },
                  ].map(({ value, label, desc }) => (
                    <label key={value} className="flex items-start gap-3 p-3 border border-gray-300 cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="action" value={value} checked={reviewForm.actionTaken === value} onChange={(e) => setReviewForm({...reviewForm, actionTaken: e.target.value})} className="mt-0.5" />
                      <div><p className="text-sm font-medium text-gray-900">{label}</p><p className="text-xs text-gray-600">{desc}</p></div>
                    </label>
                  ))}
                </div>
              </div>

              
              {reviewForm.actionTaken === 'prescribe' && (
                <div className="bg-gray-50 border border-gray-300 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Prescription Details</h4>
                  {prescriptionForm.medicines.map((med, idx) => (
                    <div key={idx} className="bg-white border border-gray-300 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Medicine {idx + 1}</span>
                        {prescriptionForm.medicines.length > 1 && <button type="button" onClick={() => removeMedicine(idx)} className="text-xs text-red-600 hover:text-red-700">Remove</button>}
                      </div>
                      <input type="text" required placeholder="Medicine name" value={med.name} onChange={(e) => { const m = [...prescriptionForm.medicines]; m[idx].name = e.target.value; setPrescriptionForm({...prescriptionForm, medicines: m}); }} className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-900" />
                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" required placeholder="Dosage" value={med.dosage} onChange={(e) => { const m = [...prescriptionForm.medicines]; m[idx].dosage = e.target.value; setPrescriptionForm({...prescriptionForm, medicines: m}); }} className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-900" />
                        <input type="text" required placeholder="Frequency" value={med.frequency} onChange={(e) => { const m = [...prescriptionForm.medicines]; m[idx].frequency = e.target.value; setPrescriptionForm({...prescriptionForm, medicines: m}); }} className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-900" />
                        <input type="text" required placeholder="Duration" value={med.duration} onChange={(e) => { const m = [...prescriptionForm.medicines]; m[idx].duration = e.target.value; setPrescriptionForm({...prescriptionForm, medicines: m}); }} className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-900" />
                      </div>
                      <input type="text" placeholder="Special instructions (optional)" value={med.instructions} onChange={(e) => { const m = [...prescriptionForm.medicines]; m[idx].instructions = e.target.value; setPrescriptionForm({...prescriptionForm, medicines: m}); }} className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-900" />
                    </div>
                  ))}
                  <button type="button" onClick={addMedicine} className="w-full px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium">+ Add Medicine</button>
                  <div><label className="block text-xs text-gray-600 mb-1">Prescription Notes</label><textarea value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm({...prescriptionForm, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" rows={2} /></div>
                </div>
              )}

              
              {reviewForm.actionTaken === 'refer' && (
                <div className="bg-gray-50 border border-gray-300 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Referral Details</h4>
                  <div><label className="block text-xs text-gray-600 mb-2">Referred To *</label><input type="text" required value={referralForm.referredTo} onChange={(e) => setReferralForm({...referralForm, referredTo: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-900" placeholder="Specialist or hospital name" /></div>
                  <div><label className="block text-xs text-gray-600 mb-2">Reason *</label><textarea required value={referralForm.reason} onChange={(e) => setReferralForm({...referralForm, reason: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-gray-900" rows={2} /></div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-300">
                <button type="button" onClick={() => { setShowReviewModal(false); resetForms(); }} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors">Complete Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showAppointmentModal && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md">
            <div className="border-b border-gray-300 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Schedule Follow-up</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedVisit.studentName}</p>
            </div>
            <form onSubmit={handleScheduleAppointment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">Appointment Date *</label>
                <input type="date" required value={appointmentForm.date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">Appointment Time *</label>
                <input type="time" required value={appointmentForm.time} onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">Notes</label>
                <textarea value={appointmentForm.notes} onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900" rows={3} placeholder="Reason for follow-up..." />
              </div>
              <div className="flex gap-3 pt-2 border-t border-gray-300">
                <button type="button" onClick={() => setShowAppointmentModal(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}