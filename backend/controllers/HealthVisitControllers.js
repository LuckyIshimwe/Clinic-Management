

const HealthVisit = require("../models/HealthVisit");
const Student     = require("../models/Student");
const Notification = require("../models/Notification");

const DEFAULT_SCHOOL_ID = "SCHOOL001";


const createNotification = async (userId, title, message, type, patientId, severity, visitId = null) => {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type,
      patientId,
      severity,
      ...(visitId && { visitId }),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};


const createHealthVisit = async (req, res) => {
  try {
    const {
      studentId, chiefComplaint, symptoms, vitals,
      nurseAssessment, nurseNotes, severity,
      nurseTreated, nurseTreatment,
      requiresLab, labRequest,
      requiresDoctorReview,
    } = req.body;

    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    const student  = await Student.findOne({ studentId, schoolId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    let status = "pending";
    if (nurseTreated)              status = "nurse_treated";
    else if (requiresLab)          status = "lab_pending";
    else if (requiresDoctorReview) status = "doctor_review";

    const visit = await HealthVisit.create({
      studentId: student.studentId,
      chiefComplaint, symptoms, vitals,
      nurseAssessment, nurseNotes, severity,
      nurseTreated, nurseTreatment,
      requiresLab, labRequest,
      requiresDoctorReview,
      status,
      attendedBy: { nurse: req.user._id },
      schoolId,
    });

    const populatedVisit = await HealthVisit.findById(visit._id);

    
    if (requiresLab) {
      const User    = require("../models/User");
      const labTechs = await User.find({ role: { $in: ["labtechnician", "lab_technician"] } });
      for (const tech of labTechs) {
        await createNotification(
          tech._id,
          "New Lab Test Request",
          `${student.fullName} (${student.studentId}) requires ${labRequest.testType}. Urgency: ${labRequest.urgency}`,
          "lab_result",
          student.studentId,
          labRequest.urgency === "Emergency" ? "high" : labRequest.urgency === "Urgent" ? "medium" : "low",
          visit._id
        );
      }
    }

    
    if (requiresDoctorReview) {
      const User    = require("../models/User");
      const doctors = await User.find({ role: "doctor" });
      for (const doctor of doctors) {
        await createNotification(
          doctor._id,
          "Patient Requires Doctor Review",
          `${student.fullName} (${student.studentId}) — ${chiefComplaint}. Severity: ${severity}`,
          "patient_attention",
          student.studentId,
          severity,
          visit._id
        );
      }
    }

    res.status(201).json({ success: true, message: "Health visit recorded successfully", visit: populatedVisit });
  } catch (error) {
    console.error("Error creating health visit:", error);
    res.status(500).json({ message: error.message });
  }
};


const getHealthVisitsByStudent = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    const visits   = await HealthVisit.find({ studentId: req.params.studentId, schoolId })
      .populate("attendedBy.nurse",   "name")
      .populate("attendedBy.labTech", "name")
      .populate("attendedBy.doctor",  "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, visits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updateHealthVisit = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    const existing = await HealthVisit.findOne({ _id: req.params.id, schoolId });
    if (!existing) return res.status(404).json({ message: "Health visit not found" });

    const visit = await HealthVisit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: "Health visit updated successfully", visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getLabPendingVisits = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    const visits = await HealthVisit.aggregate([
      { $match: { schoolId, requiresLab: true, status: "lab_pending" } },
      { $lookup: { from: "students", localField: "studentId", foreignField: "studentId", as: "studentInfo" } },
      { $unwind: "$studentInfo" },
      { $match: { "studentInfo.schoolId": schoolId } },
      {
        $project: {
          visitNumber: 1, chiefComplaint: 1, symptoms: 1, labRequest: 1,
          severity: 1, createdAt: 1,
          studentName: "$studentInfo.fullName",   studentId: "$studentInfo.studentId",
          grade:       "$studentInfo.grade",       section:   "$studentInfo.section",
          age:         "$studentInfo.age",         gender:    "$studentInfo.gender",
          bloodGroup:  "$studentInfo.bloodGroup",  allergies: "$studentInfo.allergies",
          chronicConditions: "$studentInfo.chronicConditions",
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.status(200).json({ success: true, visits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getLabCompletedVisits = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    const visits = await HealthVisit.aggregate([
      { $match: { schoolId, requiresLab: true, status: { $in: ["lab_completed", "doctor_review", "completed"] } } },
      { $lookup: { from: "students", localField: "studentId", foreignField: "studentId", as: "studentInfo" } },
      { $unwind: "$studentInfo" },
      { $match: { "studentInfo.schoolId": schoolId } },
      {
        $project: {
          visitNumber: 1, chiefComplaint: 1, symptoms: 1,
          labRequest: 1, labResults: 1, severity: 1, createdAt: 1,
          completedAt:  "$labRequest.completedAt",
          studentName:  "$studentInfo.fullName",   studentId: "$studentInfo.studentId",
          grade:        "$studentInfo.grade",       section:   "$studentInfo.section",
          age:          "$studentInfo.age",         gender:    "$studentInfo.gender",
          bloodGroup:   "$studentInfo.bloodGroup",  allergies: "$studentInfo.allergies",
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.status(200).json({ success: true, visits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const submitLabResults = async (req, res) => {
  try {
    const { labResults, status, requiresDoctorReview } = req.body;
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;

    const existingVisit = await HealthVisit.findOne({ _id: req.params.id, schoolId });
    if (!existingVisit) return res.status(404).json({ message: "Health visit not found" });

    const visit = await HealthVisit.findByIdAndUpdate(
      req.params.id,
      {
        labResults: { ...labResults, completedBy: req.user._id },
        "labRequest.completedAt": new Date(),
        status,
        requiresDoctorReview,
        "attendedBy.labTech": req.user._id,
      },
      { new: true }
    );

    const student = await Student.findOne({ studentId: visit.studentId, schoolId });
    const User    = require("../models/User");

   
    if (visit.attendedBy?.nurse) {
      await createNotification(
        visit.attendedBy.nurse,
        "Lab Results Ready",
        `Lab results for ${student.fullName} (${student.studentId}) are now available. Please review and decide next steps.`,
        "lab_result",
        student.studentId,
        "medium",
        visit._id
      );
    }

    
    if (requiresDoctorReview || labResults.criticalValues || labResults.abnormalFindings) {
      const doctors  = await User.find({ role: "doctor" });
      const severity = labResults.criticalValues ? "high" : "medium";
      const title    = labResults.criticalValues ? "🚨 Critical Lab Results" : "Lab Results — Doctor Review Required";
      const message  = labResults.criticalValues
        ? `CRITICAL: Lab results for ${student.fullName} (${student.studentId}) require immediate attention`
        : `Lab results for ${student.fullName} (${student.studentId}) show ${labResults.abnormalFindings ? "abnormal findings" : "results requiring review"}`;

      for (const doctor of doctors) {
        await createNotification(doctor._id, title, message, "lab_result", student.studentId, severity, visit._id);
      }
    }

    res.status(200).json({ success: true, message: "Lab results submitted successfully", visit });
  } catch (error) {
    console.error("Error submitting lab results:", error);
    res.status(500).json({ message: error.message });
  }
};


const getDoctorPendingReviews = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    const visits = await HealthVisit.aggregate([
      { $match: { schoolId, requiresDoctorReview: true, status: "doctor_review" } },
      { $lookup: { from: "students", localField: "studentId", foreignField: "studentId", as: "studentInfo" } },
      { $unwind: "$studentInfo" },
      { $match: { "studentInfo.schoolId": schoolId } },
      {
        $project: {
          visitNumber: 1, chiefComplaint: 1, symptoms: 1, vitals: 1,
          nurseAssessment: 1, nurseNotes: 1, labRequest: 1, labResults: 1,
          severity: 1, requiresLab: 1, createdAt: 1, attendedBy: 1,
          studentName:        "$studentInfo.fullName",          studentId:         "$studentInfo.studentId",
          grade:              "$studentInfo.grade",              section:           "$studentInfo.section",
          age:                "$studentInfo.age",                gender:            "$studentInfo.gender",
          bloodGroup:         "$studentInfo.bloodGroup",         allergies:         "$studentInfo.allergies",
          chronicConditions:  "$studentInfo.chronicConditions",  currentMedications:"$studentInfo.currentMedications",
        },
      },
      { $sort: { severity: -1, createdAt: -1 } },
    ]);
    res.status(200).json({ success: true, visits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const submitDoctorReview = async (req, res) => {
  try {
    const {
      doctorDiagnosis, doctorTreatment, doctorNotes,
      prescription, referred, referralDetails,
      hospitalized, hospitalizationDetails, status,
    } = req.body;

    const schoolId    = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    const existingVisit = await HealthVisit.findOne({ _id: req.params.id, schoolId });
    if (!existingVisit) return res.status(404).json({ message: "Health visit not found" });

    const visit = await HealthVisit.findByIdAndUpdate(
      req.params.id,
      {
        doctorDiagnosis, doctorTreatment, doctorNotes,
        prescription, referred, referralDetails,
        hospitalized, hospitalizationDetails, status,
        "attendedBy.doctor": req.user._id,
      },
      { new: true }
    );

    const student = await Student.findOne({ studentId: visit.studentId, schoolId });
    const User    = require("../models/User");

    
    if (existingVisit.attendedBy?.nurse) {
      let nurseMsg = `Dr. ${req.user.name || "Doctor"} has reviewed ${student.fullName} (${student.studentId})`;
      if (referred)                       nurseMsg += ` — Referred to ${referralDetails?.referredTo}`;
      else if (hospitalized)              nurseMsg += ` — Student hospitalized`;
      else if (prescription?.medicines?.length) nurseMsg += ` — Prescription issued`;

      await createNotification(
        existingVisit.attendedBy.nurse,
        "Doctor Review Completed",
        nurseMsg,
        "general",
        student.studentId,
        hospitalized ? "high" : "medium",
        visit._id
      );
    }

   
    if (prescription?.medicines?.length > 0) {
      try {
        const Prescription = require("../models/Prescription");
        await Prescription.create({
          patientId:    student._id,
          clinicId:     schoolId,
          prescribedBy: req.user._id,
          doctorId:     req.user.staffId || req.user._id.toString(),
          doctorName:   req.user.name || "Doctor",
          medicines:    prescription.medicines,
          notes:        prescription.notes || "",
          status:       "Active",
        });

        const pharmacists = await User.find({ role: "pharmacist" });
        for (const ph of pharmacists) {
          await createNotification(
            ph._id,
            "New Prescription",
            `Dr. ${req.user.name || "Doctor"} prescribed medication for ${student.fullName} (${student.studentId})`,
            "prescription",
            student.studentId,
            "medium",
            visit._id
          );
        }
        console.log("✅ Prescription created and pharmacists notified");
      } catch (prescErr) {
        console.error("Error creating prescription from doctor review:", prescErr);
      }
    }

    res.status(200).json({ success: true, message: "Doctor review completed successfully", visit });
  } catch (error) {
    console.error("Error submitting doctor review:", error);
    res.status(500).json({ message: error.message });
  }
};


const getAllVisits = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;
    const visits   = await HealthVisit.find({ schoolId })
      .populate("attendedBy.nurse",   "name")
      .populate("attendedBy.labTech", "name")
      .populate("attendedBy.doctor",  "name")
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, visits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const getNurseLabCompletedVisits = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;

   
    const visits = await HealthVisit.aggregate([
      {
        $match: {
          schoolId,
          requiresLab: true,
          status: "lab_completed",   
        },
      },
      {
        $lookup: {
          from:         "students",
          localField:   "studentId",
          foreignField: "studentId",
          as:           "studentInfo",
        },
      },
      { $unwind: "$studentInfo" },
      { $match: { "studentInfo.schoolId": schoolId } },
      {
        $project: {
          visitNumber:  1,
          chiefComplaint: 1,
          symptoms:     1,
          severity:     1,
          labRequest:   1,
          labResults:   1,   
          attendedBy:   1,   
          createdAt:    1,
          updatedAt:    1,
         
          studentName:  "$studentInfo.fullName",
          studentId:    "$studentInfo.studentId",
          grade:        "$studentInfo.grade",
          section:      "$studentInfo.section",
          age:          "$studentInfo.age",
          gender:       "$studentInfo.gender",
          bloodGroup:   "$studentInfo.bloodGroup",
          allergies:    "$studentInfo.allergies",
          chronicConditions: "$studentInfo.chronicConditions",
        },
      },
      { $sort: { updatedAt: -1 } },   
    ]);

    res.status(200).json({ success: true, visits, count: visits.length });
  } catch (error) {
    console.error("getNurseLabCompletedVisits error:", error);
    res.status(500).json({ message: error.message });
  }
};



const nurseLabFollowup = async (req, res) => {
  try {
    const { id }                                  = req.params;
    const { nurseTreated, nurseTreatment,
            requiresDoctorReview, status,
            notifyPharmacist }                    = req.body;

    const schoolId = req.user?.schoolId || DEFAULT_SCHOOL_ID;

    const existingVisit = await HealthVisit.findOne({ _id: id, schoolId });
    if (!existingVisit) return res.status(404).json({ message: "Health visit not found" });

   
    const updateData = { status };   

    if (nurseTreated) {
      updateData.nurseTreated   = true;
      updateData.nurseTreatment = nurseTreatment;
    }
    if (requiresDoctorReview) {
      updateData.requiresDoctorReview = true;
    }

    const visit = await HealthVisit.findByIdAndUpdate(id, updateData, { new: true });

    
    const student   = await Student.findOne({ studentId: visit.studentId, schoolId });
    const User      = require("../models/User");
    const nurseName = req.user.name || "Nurse";
    const patientId = student?.studentId || visit.studentId;
    const patientName = student?.fullName || patientId;

    
    if (nurseTreated && notifyPharmacist) {
      const pharmacists = await User.find({ role: "pharmacist" });
      for (const ph of pharmacists) {
        await createNotification(
          ph._id,
          "Nurse Treatment — Prescription May Be Required",
          `${nurseName} has treated ${patientName} (${patientId}) following lab results. ` +
          `Medication given: ${nurseTreatment?.medicationGiven || "N/A"}, ` +
          `Dosage: ${nurseTreatment?.dosage || "N/A"}. ` +
          `Please prepare a prescription if required.`,
          "prescription",
          patientId,
          "medium",
          visit._id
        );
      }
    }

   
    if (requiresDoctorReview) {
      const doctors = await User.find({ role: "doctor" });
      for (const doctor of doctors) {
        await createNotification(
          doctor._id,
          "Lab Results Escalated by Nurse",
          `${nurseName} has reviewed the lab results for ${patientName} (${patientId}) ` +
          `and requires your medical evaluation. Please check the pending reviews.`,
          "lab_result",
          patientId,
          "high",
          visit._id
        );
      }
    }

    res.status(200).json({
      success: true,
      message: nurseTreated
        ? "Student treated successfully. Pharmacist notified."
        : "Case escalated to doctor successfully.",
      visit,
    });
  } catch (error) {
    console.error("nurseLabFollowup error:", error);
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
  getAllVisits,
  
  getNurseLabCompletedVisits,
  nurseLabFollowup,
};