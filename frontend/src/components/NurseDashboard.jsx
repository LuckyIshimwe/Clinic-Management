import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function NurseDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    studentId: '',
    grade: '',
    section: '',
    age: '',
    gender: '',
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

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    fetchStudentHistory(student.studentId);
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
      fetchStudents();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRecordVisit = async (e) => {
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
      fetchStudentHistory(selectedStudent.studentId);
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
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'grade') return matchesSearch;
    return matchesSearch;
  });

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
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 16.93c-3.95-.49-7-3.85-7-7.84V6.3l6-2.25v14.88z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Nurse Dashboard</h1>
              <p className="text-xs text-gray-600">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              + Register Student
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
        <div className="grid grid-cols-12 gap-6">
          {/* Students List */}
          <div className="col-span-4 bg-white rounded-2xl shadow-sm p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Students Directory</h2>
              <input
                type="text"
                placeholder="Search by name, ID, or family..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm text-gray-500">No students found</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <button
                    key={student._id}
                    onClick={() => handleStudentSelect(student)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedStudent?._id === student._id
                        ? 'bg-teal-50 border-2 border-teal-200'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-800">{student.fullName}</span>
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-md">
                        Grade {student.grade}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{student.studentId}</p>
                    <p className="text-xs text-gray-500 mt-1">{student.age} yrs • {student.gender}</p>
                    {student.allergies && (
                      <div className="mt-2 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        ⚠️ Allergies: {student.allergies}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Student Details */}
          <div className="col-span-8">
            {selectedStudent ? (
              <div className="space-y-6">
                {/* Student Info Card */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">{selectedStudent.fullName}</h2>
                      <p className="text-sm text-gray-600">{selectedStudent.studentId}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowVisitModal(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        Record Visit
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Grade</p>
                      <p className="text-sm font-medium text-gray-800">
                        {selectedStudent.grade}{selectedStudent.section && `-${selectedStudent.section}`}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Age</p>
                      <p className="text-sm font-medium text-gray-800">{selectedStudent.age} years</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Gender</p>
                      <p className="text-sm font-medium text-gray-800">{selectedStudent.gender}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">Blood Group</p>
                      <p className="text-sm font-medium text-gray-800">{selectedStudent.bloodGroup}</p>
                    </div>
                  </div>

                  {selectedStudent.allergies && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
                      <p className="text-sm font-semibold text-red-800">⚠️ Allergies: {selectedStudent.allergies}</p>
                    </div>
                  )}

                  {selectedStudent.chronicConditions && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
                      <p className="text-sm font-semibold text-yellow-800">Chronic: {selectedStudent.chronicConditions}</p>
                    </div>
                  )}

                  {selectedStudent.currentMedications && (
                    <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded">
                      <p className="text-sm font-semibold text-teal-800">Medications: {selectedStudent.currentMedications}</p>
                    </div>
                  )}
                </div>

                {/* Recent Visits */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Recent Health Visits</h3>
                  <div className="space-y-3">
                    {medicalHistory.length === 0 ? (
                      <p className="text-center text-gray-500 py-8 text-sm">No health visits recorded</p>
                    ) : (
                      medicalHistory.slice(0, 5).map((visit) => (
                        <div key={visit._id} className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-800">{visit.chiefComplaint}</h4>
                              <p className="text-xs text-gray-600 mt-1">{visit.symptoms}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                                visit.status === 'nurse_treated' ? 'bg-teal-100 text-teal-700' :
                                visit.status === 'lab_pending' ? 'bg-yellow-100 text-yellow-700' :
                                visit.status === 'doctor_review' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {visit.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(visit.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {visit.nurseTreated && visit.nurseTreatment && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Treatment:</span> {visit.nurseTreatment.medicationGiven}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-500">Select a student to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register Student Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Register New Student</h2>
            </div>
            <form onSubmit={handleRegisterStudent} className="p-6 space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({...registerForm, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.studentId}
                    onChange={(e) => setRegisterForm({...registerForm, studentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 5, 10, 12"
                    value={registerForm.grade}
                    onChange={(e) => setRegisterForm({...registerForm, grade: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input
                    type="text"
                    placeholder="e.g., A, B"
                    value={registerForm.section}
                    onChange={(e) => setRegisterForm({...registerForm, section: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    value={registerForm.age}
                    onChange={(e) => setRegisterForm({...registerForm, age: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    required
                    value={registerForm.gender}
                    onChange={(e) => setRegisterForm({...registerForm, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Family Name *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.familyName}
                    onChange={(e) => setRegisterForm({...registerForm, familyName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={registerForm.bloodGroup}
                    onChange={(e) => setRegisterForm({...registerForm, bloodGroup: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
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

              {/* Parent Contact */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Parent/Guardian Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Father's Name</label>
                    <input
                      type="text"
                      value={registerForm.parentContact.fatherName}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        parentContact: {...registerForm.parentContact, fatherName: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Father's Phone</label>
                    <input
                      type="tel"
                      value={registerForm.parentContact.fatherPhone}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        parentContact: {...registerForm.parentContact, fatherPhone: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mother's Name</label>
                    <input
                      type="text"
                      value={registerForm.parentContact.motherName}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        parentContact: {...registerForm.parentContact, motherName: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mother's Phone</label>
                    <input
                      type="tel"
                      value={registerForm.parentContact.motherPhone}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        parentContact: {...registerForm.parentContact, motherPhone: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Emergency Phone *</label>
                    <input
                      type="tel"
                      required
                      value={registerForm.parentContact.emergencyPhone}
                      onChange={(e) => setRegisterForm({
                        ...registerForm,
                        parentContact: {...registerForm.parentContact, emergencyPhone: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Medical Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Known Allergies</label>
                    <textarea
                      value={registerForm.allergies}
                      onChange={(e) => setRegisterForm({...registerForm, allergies: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      rows={2}
                      placeholder="e.g., Penicillin, Peanuts, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Chronic Conditions</label>
                    <textarea
                      value={registerForm.chronicConditions}
                      onChange={(e) => setRegisterForm({...registerForm, chronicConditions: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      rows={2}
                      placeholder="e.g., Asthma, Diabetes, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Medications</label>
                    <textarea
                      value={registerForm.currentMedications}
                      onChange={(e) => setRegisterForm({...registerForm, currentMedications: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      rows={2}
                      placeholder="List any medications student is currently taking"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    resetRegisterForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Visit Modal */}
      {showVisitModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Record Health Visit</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedStudent.fullName} • Grade {selectedStudent.grade}</p>
            </div>
            <form onSubmit={handleRecordVisit} className="p-6 space-y-4">
              {/* Chief Complaint & Symptoms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint *</label>
                <input
                  type="text"
                  required
                  value={visitForm.chiefComplaint}
                  onChange={(e) => setVisitForm({...visitForm, chiefComplaint: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  placeholder="Main reason for visit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms *</label>
                <textarea
                  required
                  value={visitForm.symptoms}
                  onChange={(e) => setVisitForm({...visitForm, symptoms: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  rows={3}
                  placeholder="Describe symptoms in detail..."
                />
              </div>

              {/* Vitals */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Vital Signs</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Temperature</label>
                    <input
                      type="text"
                      placeholder="98.6°F"
                      value={visitForm.vitals.temperature}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        vitals: {...visitForm.vitals, temperature: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Blood Pressure</label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={visitForm.vitals.bloodPressure}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        vitals: {...visitForm.vitals, bloodPressure: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Heart Rate</label>
                    <input
                      type="text"
                      placeholder="72 bpm"
                      value={visitForm.vitals.heartRate}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        vitals: {...visitForm.vitals, heartRate: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Assessment & Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nurse Assessment</label>
                <textarea
                  value={visitForm.nurseAssessment}
                  onChange={(e) => setVisitForm({...visitForm, nurseAssessment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  rows={2}
                  placeholder="Your clinical assessment..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={visitForm.severity}
                  onChange={(e) => setVisitForm({...visitForm, severity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Treatment Decision */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Treatment Decision *</h3>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="treatmentDecision"
                      value="treat"
                      checked={visitForm.treatmentDecision === 'treat'}
                      onChange={(e) => setVisitForm({...visitForm, treatmentDecision: e.target.value})}
                      className="mt-1 w-4 h-4 text-teal-600"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-800">I can treat the student</p>
                      <p className="text-xs text-gray-600">Provide medication and mark as treated</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="treatmentDecision"
                      value="lab"
                      checked={visitForm.treatmentDecision === 'lab'}
                      onChange={(e) => setVisitForm({...visitForm, treatmentDecision: e.target.value})}
                      className="mt-1 w-4 h-4 text-teal-600"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-800">Send to Lab Technician</p>
                      <p className="text-xs text-gray-600">Request laboratory tests</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="treatmentDecision"
                      value="doctor"
                      checked={visitForm.treatmentDecision === 'doctor'}
                      onChange={(e) => setVisitForm({...visitForm, treatmentDecision: e.target.value})}
                      className="mt-1 w-4 h-4 text-teal-600"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-800">Send to Doctor</p>
                      <p className="text-xs text-gray-600">Requires doctor's review</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Conditional Forms */}
              {visitForm.treatmentDecision === 'treat' && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-gray-800">Treatment Details</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Medication Given *</label>
                    <input
                      type="text"
                      required
                      value={visitForm.nurseTreatment.medicationGiven}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        nurseTreatment: {...visitForm.nurseTreatment, medicationGiven: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={visitForm.nurseTreatment.dosage}
                        onChange={(e) => setVisitForm({
                          ...visitForm,
                          nurseTreatment: {...visitForm.nurseTreatment, dosage: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Instructions</label>
                      <input
                        type="text"
                        value={visitForm.nurseTreatment.instructions}
                        onChange={(e) => setVisitForm({
                          ...visitForm,
                          nurseTreatment: {...visitForm.nurseTreatment, instructions: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {visitForm.treatmentDecision === 'lab' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-gray-800">Lab Test Request</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Test Type *</label>
                    <select
                      required
                      value={visitForm.labRequest.testType}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        labRequest: {...visitForm.labRequest, testType: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Test Details</label>
                    <textarea
                      value={visitForm.labRequest.testDetails}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        labRequest: {...visitForm.labRequest, testDetails: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Urgency</label>
                    <select
                      value={visitForm.labRequest.urgency}
                      onChange={(e) => setVisitForm({
                        ...visitForm,
                        labRequest: {...visitForm.labRequest, urgency: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowVisitModal(false);
                    resetVisitForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors"
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