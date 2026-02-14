import { useState, useEffect } from 'react';
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
  
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    studentId: '',
    grade: '',
    section: '',
    age: '',
    gender: 'Male',
    familyName: '',
    bloodGroup: 'Unknown',
    parentContact: {
      fatherName: '',
      fatherPhone: '',
      motherName: '',
      motherPhone: '',
      guardianName: '',
      guardianPhone: '',
      emergencyPhone: ''
    },
    allergies: '',
    chronicConditions: '',
    currentMedications: ''
  });

  const [visitForm, setVisitForm] = useState({
    chiefComplaint: '',
    symptoms: '',
    vitals: {
      temperature: '',
      bloodPressure: '',
      heartRate: '',
      weight: '',
      height: '',
      oxygenSaturation: ''
    },
    nurseAssessment: '',
    nurseNotes: '',
    severity: 'low',
    treatmentDecision: '',
    nurseTreatment: {
      medicationGiven: '',
      dosage: '',
      instructions: '',
      treatmentNotes: ''
    },
    labRequest: {
      testType: '',
      testDetails: '',
      urgency: 'Normal'
    }
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      navigate('/');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'nurse') {
      navigate('/');
      return;
    }

    setUser(userData);
    fetchStudents();
  }, [navigate]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${baseURL}/students/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStudents(res.data.students); 
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setLoading(false);
    }
  };

  const fetchStudentHistory = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${baseURL}/health-visits/student/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMedicalHistory(res.data.visits || []);
    } catch (err) {
      console.error('Error fetching student history:', err);
    }
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    fetchStudentHistory(student.studentId);
    setShowDetailsModal(true);
  };

  const handleRecordVisit = (student) => {
    setSelectedStudent(student);
    setShowVisitModal(true);
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

  const handleSubmitVisit = async (e) => {
    e.preventDefault();
    
    if (!visitForm.treatmentDecision) {
      alert('Please select a treatment decision');
      return;
    }

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
        visitData.nurseTreatment = {
          ...visitForm.nurseTreatment,
          treatedAt: new Date()
        };
        visitData.status = 'nurse_treated';
      } else if (visitForm.treatmentDecision === 'lab') {
        visitData.requiresLab = true;
        visitData.labRequest = {
          ...visitForm.labRequest,
          requestedAt: new Date()
        };
        visitData.status = 'lab_pending';
      } else if (visitForm.treatmentDecision === 'doctor') {
        visitData.requiresDoctorReview = true;
        visitData.status = 'doctor_review';
      }

      await axios.post(`${baseURL}/health-visits/`, visitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const message = visitForm.treatmentDecision === 'treat' 
        ? 'Visit recorded and student treated!'
        : visitForm.treatmentDecision === 'lab'
        ? 'Visit recorded and lab technician notified!'
        : 'Visit recorded and doctor notified!';

      alert(message);
      setShowVisitModal(false);
      resetVisitForm();
      await fetchStudentHistory(selectedStudent.studentId);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetRegisterForm = () => {
    setRegisterForm({
      fullName: '',
      studentId: '',
      grade: '',
      section: '',
      age: '',
      gender: 'Male',
      familyName: '',
      bloodGroup: 'Unknown',
      parentContact: {
        fatherName: '',
        fatherPhone: '',
        motherName: '',
        motherPhone: '',
        guardianName: '',
        guardianPhone: '',
        emergencyPhone: ''
      },
      allergies: '',
      chronicConditions: '',
      currentMedications: ''
    });
  };

  const resetVisitForm = () => {
    setVisitForm({
      chiefComplaint: '',
      symptoms: '',
      vitals: {
        temperature: '',
        bloodPressure: '',
        heartRate: '',
        weight: '',
        height: '',
        oxygenSaturation: ''
      },
      nurseAssessment: '',
      nurseNotes: '',
      severity: 'low',
      treatmentDecision: '',
      nurseTreatment: {
        medicationGiven: '',
        dosage: '',
        instructions: '',
        treatmentNotes: ''
      },
      labRequest: {
        testType: '',
        testDetails: '',
        urgency: 'Normal'
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.familyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Pagination
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
      {/* Header */}
      <div className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Nurse Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
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
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, student ID, or family name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
          />
        </div>

        {/* Students Table */}
        <div className="bg-white border border-gray-300">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Blood Group
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                currentStudents.map((student) => (
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
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {student.grade}{student.section && `-${student.section}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.age}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.gender}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.bloodGroup}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewDetails(student)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleRecordVisit(student)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                      >
                        Record Visit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length} students
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 text-sm border ${
                      currentPage === i + 1
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Student Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Full Name</label>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Student ID</label>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.studentId}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Grade/Section</label>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStudent.grade}{selectedStudent.section && `-${selectedStudent.section}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Age</label>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.age} years</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Gender</label>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.gender}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Blood Group</label>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.bloodGroup}</p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Medical Information</h3>
                <div className="space-y-3">
                  {selectedStudent.allergies && (
                    <div className="border border-red-300 bg-red-50 p-4">
                      <label className="block text-xs text-red-900 font-semibold mb-1">Allergies</label>
                      <p className="text-sm text-red-900">{selectedStudent.allergies}</p>
                    </div>
                  )}
                  {selectedStudent.chronicConditions && (
                    <div className="border border-gray-300 p-4">
                      <label className="block text-xs text-gray-600 font-semibold mb-1">Chronic Conditions</label>
                      <p className="text-sm text-gray-900">{selectedStudent.chronicConditions}</p>
                    </div>
                  )}
                  {selectedStudent.currentMedications && (
                    <div className="border border-gray-300 p-4">
                      <label className="block text-xs text-gray-600 font-semibold mb-1">Current Medications</label>
                      <p className="text-sm text-gray-900">{selectedStudent.currentMedications}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Health Visit History */}
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
                            <span className="inline-block px-2 py-1 text-xs font-medium border border-gray-300">
                              {visit.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(visit.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {visit.nurseTreated && visit.nurseTreatment && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600">
                              <span className="font-semibold">Treatment:</span> {visit.nurseTreatment.medicationGiven}
                            </p>
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

      {/* Register Student Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Register New Student</h2>
            </div>
            <form onSubmit={handleRegisterStudent} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={registerForm.fullName}
                      onChange={(e) => setRegisterForm({...registerForm, fullName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Student ID *</label>
                    <input
                      type="text"
                      required
                      value={registerForm.studentId}
                      onChange={(e) => setRegisterForm({...registerForm, studentId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Grade *</label>
                    <input
                      type="text"
                      required
                      value={registerForm.grade}
                      onChange={(e) => setRegisterForm({...registerForm, grade: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Section</label>
                    <input
                      type="text"
                      value={registerForm.section}
                      onChange={(e) => setRegisterForm({...registerForm, section: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Age *</label>
                    <input
                      type="number"
                      required
                      value={registerForm.age}
                      onChange={(e) => setRegisterForm({...registerForm, age: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Gender *</label>
                    <select
                      required
                      value={registerForm.gender}
                      onChange={(e) => setRegisterForm({...registerForm, gender: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Family Name *</label>
                    <input
                      type="text"
                      required
                      value={registerForm.familyName}
                      onChange={(e) => setRegisterForm({...registerForm, familyName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Blood Group</label>
                    <select
                      value={registerForm.bloodGroup}
                      onChange={(e) => setRegisterForm({...registerForm, bloodGroup: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
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
              </div>

              {/* Emergency Contact */}
              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Father's Name</label>
                    <input
                      type="text"
                      value={registerForm.parentContact.fatherName}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        parentContact: {...registerForm.parentContact, fatherName: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Father's Phone</label>
                    <input
                      type="tel"
                      value={registerForm.parentContact.fatherPhone}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        parentContact: {...registerForm.parentContact, fatherPhone: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Mother's Name</label>
                    <input
                      type="text"
                      value={registerForm.parentContact.motherName}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        parentContact: {...registerForm.parentContact, motherName: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Mother's Phone</label>
                    <input
                      type="tel"
                      value={registerForm.parentContact.motherPhone}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        parentContact: {...registerForm.parentContact, motherPhone: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-2">Emergency Phone *</label>
                    <input
                      type="tel"
                      required
                      value={registerForm.parentContact.emergencyPhone}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        parentContact: {...registerForm.parentContact, emergencyPhone: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-4">Medical Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Known Allergies</label>
                    <textarea
                      value={registerForm.allergies}
                      onChange={(e) => setRegisterForm({...registerForm, allergies: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Chronic Conditions</label>
                    <textarea
                      value={registerForm.chronicConditions}
                      onChange={(e) => setRegisterForm({...registerForm, chronicConditions: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Current Medications</label>
                    <textarea
                      value={registerForm.currentMedications}
                      onChange={(e) => setRegisterForm({...registerForm, currentMedications: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    resetRegisterForm();
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Visit Modal - Continuing... */}
      {showVisitModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Record Health Visit</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedStudent.fullName} • {selectedStudent.studentId}</p>
            </div>
            <form onSubmit={handleSubmitVisit} className="p-6 space-y-6">
              <div>
                <label className="block text-xs text-gray-600 mb-2">Chief Complaint *</label>
                <input
                  type="text"
                  required
                  value={visitForm.chiefComplaint}
                  onChange={(e) => setVisitForm({...visitForm, chiefComplaint: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2">Symptoms *</label>
                <textarea
                  required
                  value={visitForm.symptoms}
                  onChange={(e) => setVisitForm({...visitForm, symptoms: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                  rows={3}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-3">Vital Signs</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Temperature</label>
                    <input
                      type="text"
                      value={visitForm.vitals.temperature}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        vitals: {...visitForm.vitals, temperature: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Blood Pressure</label>
                    <input
                      type="text"
                      value={visitForm.vitals.bloodPressure}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        vitals: {...visitForm.vitals, bloodPressure: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Heart Rate</label>
                    <input
                      type="text"
                      value={visitForm.vitals.heartRate}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        vitals: {...visitForm.vitals, heartRate: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2">Nurse Assessment</label>
                <textarea
                  value={visitForm.nurseAssessment}
                  onChange={(e) => setVisitForm({...visitForm, nurseAssessment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-2">Severity</label>
                <select
                  value={visitForm.severity}
                  onChange={(e) => setVisitForm({...visitForm, severity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase mb-3">Treatment Decision *</h3>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border border-gray-300 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="treatmentDecision"
                      value="treat"
                      checked={visitForm.treatmentDecision === 'treat'}
                      onChange={(e) => setVisitForm({...visitForm, treatmentDecision: e.target.value})}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Treat Student</p>
                      <p className="text-xs text-gray-600">Provide medication and mark as treated</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-300 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="treatmentDecision"
                      value="lab"
                      checked={visitForm.treatmentDecision === 'lab'}
                      onChange={(e) => setVisitForm({...visitForm, treatmentDecision: e.target.value})}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Send to Lab</p>
                      <p className="text-xs text-gray-600">Request laboratory tests</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-gray-300 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="treatmentDecision"
                      value="doctor"
                      checked={visitForm.treatmentDecision === 'doctor'}
                      onChange={(e) => setVisitForm({...visitForm, treatmentDecision: e.target.value})}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Send to Doctor</p>
                      <p className="text-xs text-gray-600">Requires doctor's review</p>
                    </div>
                  </label>
                </div>
              </div>

              {visitForm.treatmentDecision === 'treat' && (
                <div className="bg-gray-50 border border-gray-300 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Treatment Details</h4>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Medication Given *</label>
                    <input
                      type="text"
                      required
                      value={visitForm.nurseTreatment.medicationGiven}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        nurseTreatment: {...visitForm.nurseTreatment, medicationGiven: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Dosage</label>
                      <input
                        type="text"
                        value={visitForm.nurseTreatment.dosage}
                        onChange={(e) => setVisitForm({
                          ...visitForm,
                          nurseTreatment: {...visitForm.nurseTreatment, dosage: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Instructions</label>
                      <input
                        type="text"
                        value={visitForm.nurseTreatment.instructions}
                        onChange={(e) => setVisitForm({
                          ...visitForm,
                          nurseTreatment: {...visitForm.nurseTreatment, instructions: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {visitForm.treatmentDecision === 'lab' && (
                <div className="bg-gray-50 border border-gray-300 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Lab Test Request</h4>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Test Type *</label>
                    <select
                      required
                      value={visitForm.labRequest.testType}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        labRequest: {...visitForm.labRequest, testType: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    >
                      <option value="">Select test type</option>
                      <option value="Blood Test">Blood Test</option>
                      <option value="Urine Test">Urine Test</option>
                      <option value="Vision Test">Vision Test</option>
                      <option value="Hearing Test">Hearing Test</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Test Details</label>
                    <textarea
                      value={visitForm.labRequest.testDetails}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        labRequest: {...visitForm.labRequest, testDetails: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Urgency</label>
                    <select
                      value={visitForm.labRequest.urgency}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        labRequest: {...visitForm.labRequest, urgency: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => {
                    setShowVisitModal(false);
                    resetVisitForm();
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors"
                >
                  Record Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}