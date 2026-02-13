const HealthVisit = require("../models/HealthVisit");
const Student = require("../models/Student");
const Notification = require("../models/Notification");

// Helper function to create notification
const createNotification = async (userId, title, message, type, patientId, severity) => {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type,
      patientId,
      severity
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};


const createHealthVisit = async (req, res) => {
  try {
    const {
      studentId,
      chiefComplaint,
      symptoms,
      vitals,
      nurseAssessment,
      nurseNotes,
      severity,
      nurseTreated,
      nurseTreatment,
      requiresLab,
      labRequest,
      requiresDoctorReview
    } = req.body;

    
    const student = await Student.findOne({ studentId, schoolId: "SCHOOL001" });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Determine status based on treatment decision
    let status = 'pending';
    if (nurseTreated) {
      status = 'nurse_treated';
    } else if (requiresLab) {
      status = 'lab_pending';
    } else if (requiresDoctorReview) {
      status = 'doctor_review';
    }

    // Create health visit
    const visit = await HealthVisit.create({
      studentId: student.studentId,
      chiefComplaint,
      symptoms,
      vitals,
      nurseAssessment,
      nurseNotes,
      severity,
      nurseTreated,
      nurseTreatment,
      requiresLab,
      labRequest,
      requiresDoctorReview,
      status,
      attendedBy: {
        nurse: req.user._id
      },
      schoolId: "SCHOOL001"
    });

    // Populate visit with student details for notifications
    const populatedVisit = await HealthVisit.findById(visit._id);

    // Send notifications based on status
    if (requiresLab) {
      // Notify lab technicians
      const User = require("../models/User");
      const labTechs = await User.find({ role: "lab_technician", schoolId: "SCHOOL001" });
      
      for (const tech of labTechs) {
        await createNotification(
          tech._id,
          "New Lab Test Request",
          `${student.fullName} (${student.studentId}) requires ${labRequest.testType}. Urgency: ${labRequest.urgency}`,
          "patient_attention",
          student.studentId,
          labRequest.urgency === 'Emergency' ? 'high' : 'medium'
        );
      }
    }

    if (requiresDoctorReview) {
      // Notify doctors
      const User = require("../models/User");
      const doctors = await User.find({ role: "doctor", schoolId: "SCHOOL001" });
      
      for (const doctor of doctors) {
        await createNotification(
          doctor._id,
          "Patient Requires Doctor Review",
          `${student.fullName} (${student.studentId}) - ${chiefComplaint}. Severity: ${severity}`,
          "patient_attention",
          student.studentId,
          severity
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Health visit recorded successfully",
      visit
    });
  } catch (error) {
    console.error("Error creating health visit:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all health visits for a student
// @route   GET /api/health-visits/student/:studentId
// @access  Private
const getHealthVisitsByStudent = async (req, res) => {
  try {
    const visits = await HealthVisit.find({
      studentId: req.params.studentId,
      schoolId: "SCHOOL001"
    })
    .populate('attendedBy.nurse', 'name')
    .populate('attendedBy.labTech', 'name')
    .populate('attendedBy.doctor', 'name')
    .sort({ createdAt: -1 });

    res.status(200).json(visits);
  } catch (error) {
    console.error("Error fetching health visits:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update health visit
// @route   PUT /api/health-visits/:id
// @access  Private
const updateHealthVisit = async (req, res) => {
  try {
    const visit = await HealthVisit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!visit) {
      return res.status(404).json({ message: "Health visit not found" });
    }

    res.status(200).json({
      success: true,
      message: "Health visit updated successfully",
      visit
    });
  } catch (error) {
    console.error("Error updating health visit:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending lab tests
// @route   GET /api/health-visits/lab/pending
// @access  Private (Lab Technician)
const getLabPendingVisits = async (req, res) => {
  try {
    const visits = await HealthVisit.aggregate([
      {
        $match: {
          schoolId: "SCHOOL001",
          requiresLab: true,
          status: 'lab_pending'
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: 'studentId',
          as: 'studentInfo'
        }
      },
      {
        $unwind: '$studentInfo'
      },
      {
        $project: {
          visitNumber: 1,
          chiefComplaint: 1,
          symptoms: 1,
          labRequest: 1,
          severity: 1,
          createdAt: 1,
          studentName: '$studentInfo.fullName',
          studentId: '$studentInfo.studentId',
          grade: '$studentInfo.grade',
          section: '$studentInfo.section',
          age: '$studentInfo.age',
          gender: '$studentInfo.gender',
          bloodGroup: '$studentInfo.bloodGroup',
          allergies: '$studentInfo.allergies',
          chronicConditions: '$studentInfo.chronicConditions'
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.status(200).json(visits);
  } catch (error) {
    console.error("Error fetching pending lab tests:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get completed lab tests
// @route   GET /api/health-visits/lab/completed
// @access  Private (Lab Technician)
const getLabCompletedVisits = async (req, res) => {
  try {
    const visits = await HealthVisit.aggregate([
      {
        $match: {
          schoolId: "SCHOOL001",
          requiresLab: true,
          status: { $in: ['lab_completed', 'doctor_review', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: 'studentId',
          as: 'studentInfo'
        }
      },
      {
        $unwind: '$studentInfo'
      },
      {
        $project: {
          visitNumber: 1,
          chiefComplaint: 1,
          symptoms: 1,
          labRequest: 1,
          labResults: 1,
          severity: 1,
          createdAt: 1,
          completedAt: '$labRequest.completedAt',
          studentName: '$studentInfo.fullName',
          studentId: '$studentInfo.studentId',
          grade: '$studentInfo.grade',
          section: '$studentInfo.section',
          age: '$studentInfo.age',
          gender: '$studentInfo.gender',
          bloodGroup: '$studentInfo.bloodGroup',
          allergies: '$studentInfo.allergies',
          chronicConditions: '$studentInfo.chronicConditions'
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.status(200).json(visits);
  } catch (error) {
    console.error("Error fetching completed lab tests:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit lab results
// @route   PUT /api/health-visits/:id/lab-results
// @access  Private (Lab Technician)
const submitLabResults = async (req, res) => {
  try {
    const { labResults, status, requiresDoctorReview } = req.body;

    const visit = await HealthVisit.findByIdAndUpdate(
      req.params.id,
      {
        labResults: {
          ...labResults,
          completedBy: req.user._id
        },
        'labRequest.completedAt': new Date(),
        status,
        requiresDoctorReview,
        'attendedBy.labTech': req.user._id
      },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ message: "Health visit not found" });
    }

    // Get student details
    const student = await Student.findOne({ studentId: visit.studentId });

    // Notify nurse
    const User = require("../models/User");
    if (visit.attendedBy.nurse) {
      await createNotification(
        visit.attendedBy.nurse,
        "Lab Results Available",
        `Lab results for ${student.fullName} (${student.studentId}) are ready`,
        "lab_result",
        student.studentId,
        'medium'
      );
    }

    // If critical or abnormal, notify doctors
    if (requiresDoctorReview || labResults.criticalValues || labResults.abnormalFindings) {
      const doctors = await User.find({ role: "doctor", schoolId: "SCHOOL001" });
      
      const severity = labResults.criticalValues ? 'high' : 'medium';
      const message = labResults.criticalValues 
        ? `CRITICAL: Lab results for ${student.fullName} (${student.studentId}) require immediate attention`
        : `Lab results for ${student.fullName} (${student.studentId}) show abnormal findings`;

      for (const doctor of doctors) {
        await createNotification(
          doctor._id,
          "Lab Results - Doctor Review Required",
          message,
          "lab_result",
          student.studentId,
          severity
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Lab results submitted successfully",
      visit
    });
  } catch (error) {
    console.error("Error submitting lab results:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending doctor reviews
// @route   GET /api/health-visits/doctor/pending
// @access  Private (Doctor)
const getDoctorPendingReviews = async (req, res) => {
  try {
    const visits = await HealthVisit.aggregate([
      {
        $match: {
          schoolId: "SCHOOL001",
          requiresDoctorReview: true,
          status: 'doctor_review'
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: 'studentId',
          as: 'studentInfo'
        }
      },
      {
        $unwind: '$studentInfo'
      },
      {
        $project: {
          visitNumber: 1,
          chiefComplaint: 1,
          symptoms: 1,
          vitals: 1,
          nurseAssessment: 1,
          nurseNotes: 1,
          labRequest: 1,
          labResults: 1,
          severity: 1,
          requiresLab: 1,
          createdAt: 1,
          studentName: '$studentInfo.fullName',
          studentId: '$studentInfo.studentId',
          grade: '$studentInfo.grade',
          section: '$studentInfo.section',
          age: '$studentInfo.age',
          gender: '$studentInfo.gender',
          bloodGroup: '$studentInfo.bloodGroup',
          allergies: '$studentInfo.allergies',
          chronicConditions: '$studentInfo.chronicConditions',
          currentMedications: '$studentInfo.currentMedications'
        }
      },
      {
        $sort: { severity: -1, createdAt: -1 }
      }
    ]);

    res.status(200).json(visits);
  } catch (error) {
    console.error("Error fetching pending doctor reviews:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit doctor review
// @route   PUT /api/health-visits/:id/doctor-review
// @access  Private (Doctor)
const submitDoctorReview = async (req, res) => {
  try {
    const {
      doctorDiagnosis,
      doctorTreatment,
      doctorNotes,
      prescription,
      referred,
      referralDetails,
      hospitalized,
      hospitalizationDetails,
      status
    } = req.body;

    const visit = await HealthVisit.findByIdAndUpdate(
      req.params.id,
      {
        doctorDiagnosis,
        doctorTreatment,
        doctorNotes,
        prescription,
        referred,
        referralDetails,
        hospitalized,
        hospitalizationDetails,
        status,
        'attendedBy.doctor': req.user._id
      },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ message: "Health visit not found" });
    }

    // Get student details
    const student = await Student.findOne({ studentId: visit.studentId });

    // Notify nurse
    const User = require("../models/User");
    if (visit.attendedBy.nurse) {
      let message = `Doctor has reviewed ${student.fullName} (${student.studentId})`;
      if (referred) {
        message += ` - Student referred to ${referralDetails.referredTo}`;
      } else if (hospitalized) {
        message += ` - Student hospitalized`;
      }

      await createNotification(
        visit.attendedBy.nurse,
        "Doctor Review Completed",
        message,
        "general",
        student.studentId,
        hospitalized ? 'high' : 'medium'
      );
    }

    res.status(200).json({
      success: true,
      message: "Doctor review completed successfully",
      visit
    });
  } catch (error) {
    console.error("Error submitting doctor review:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all visits (admin/doctor)
// @route   GET /api/health-visits/all
// @access  Private (Doctor, Admin)
const getAllVisits = async (req, res) => {
  try {
    const visits = await HealthVisit.find({ schoolId: "SCHOOL001" })
      .populate('attendedBy.nurse', 'name')
      .populate('attendedBy.labTech', 'name')
      .populate('attendedBy.doctor', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(visits);
  } catch (error) {
    console.error("Error fetching all visits:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createHealthVisit,
  getHealthVisitsByStudent,
  updateHealthVisit,
  getLabPendingVisits,
  getLabCompletedVisits,
  submitLabResults,
  getDoctorPendingReviews,
  submitDoctorReview,
  getAllVisits
};