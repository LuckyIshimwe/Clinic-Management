const HealthVisit = require("../models/HealthVisit");
const Student = require("../models/Student");
const Notification = require("../models/Notification");


const DEFAULT_SCHOOL_ID = "SCHOOL001";

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

    
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;

   
    const student = await Student.findOne({ studentId, schoolId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    
    let status = 'pending';
    if (nurseTreated) {
      status = 'nurse_treated';
    } else if (requiresLab) {
      status = 'lab_pending';
    } else if (requiresDoctorReview) {
      status = 'doctor_review';
    }

    
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
      schoolId
    });

    const populatedVisit = await HealthVisit.findById(visit._id);

    
    if (requiresLab) {
      const User = require("../models/User");
      const labTechs = await User.find({ role: "lab_technician" });
      
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
      const User = require("../models/User");
      const doctors = await User.find({ role: "doctor" });
      
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
      visit: populatedVisit
    });
  } catch (error) {
    console.error("Error creating health visit:", error);
    res.status(500).json({ message: error.message });
  }
};

const getHealthVisitsByStudent = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    
    const visits = await HealthVisit.find({
      studentId: req.params.studentId,
      schoolId
    })
    .populate('attendedBy.nurse', 'name')
    .populate('attendedBy.labTech', 'name')
    .populate('attendedBy.doctor', 'name')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      visits
    });
  } catch (error) {
    console.error("Error fetching health visits:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateHealthVisit = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    
    
    const existingVisit = await HealthVisit.findOne({
      _id: req.params.id,
      schoolId
    });

    if (!existingVisit) {
      return res.status(404).json({ message: "Health visit not found" });
    }

    const visit = await HealthVisit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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

const getLabPendingVisits = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    
    const visits = await HealthVisit.aggregate([
      {
        $match: {
          schoolId,
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
        $match: {
          'studentInfo.schoolId': schoolId
        }
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

    res.status(200).json({
      success: true,
      visits
    });
  } catch (error) {
    console.error("Error fetching pending lab tests:", error);
    res.status(500).json({ message: error.message });
  }
};

const getLabCompletedVisits = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    
    const visits = await HealthVisit.aggregate([
      {
        $match: {
          schoolId,
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
        $match: {
          'studentInfo.schoolId': schoolId
        }
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

    res.status(200).json({
      success: true,
      visits
    });
  } catch (error) {
    console.error("Error fetching completed lab tests:", error);
    res.status(500).json({ message: error.message });
  }
};

const submitLabResults = async (req, res) => {
  try {
    const { labResults, status, requiresDoctorReview } = req.body;
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;

    const existingVisit = await HealthVisit.findOne({
      _id: req.params.id,
      schoolId
    });

    if (!existingVisit) {
      return res.status(404).json({ message: "Health visit not found" });
    }

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

   
    const student = await Student.findOne({ 
      studentId: visit.studentId,
      schoolId 
    });

    
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

  
    if (requiresDoctorReview || labResults.criticalValues || labResults.abnormalFindings) {
      const doctors = await User.find({ role: "doctor" });
      
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

const getDoctorPendingReviews = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    
    const visits = await HealthVisit.aggregate([
      {
        $match: {
          schoolId,
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
        $match: {
          'studentInfo.schoolId': schoolId
        }
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

    res.status(200).json({
      success: true,
      visits
    });
  } catch (error) {
    console.error("Error fetching pending doctor reviews:", error);
    res.status(500).json({ message: error.message });
  }
};

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

    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;

  
    const existingVisit = await HealthVisit.findOne({
      _id: req.params.id,
      schoolId
    });

    if (!existingVisit) {
      return res.status(404).json({ message: "Health visit not found" });
    }

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

    
    const student = await Student.findOne({ 
      studentId: visit.studentId,
      schoolId 
    });

    
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

const getAllVisits = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    
    const visits = await HealthVisit.find({ schoolId })
      .populate('attendedBy.nurse', 'name')
      .populate('attendedBy.labTech', 'name')
      .populate('attendedBy.doctor', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      visits
    });
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