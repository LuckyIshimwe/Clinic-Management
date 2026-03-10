const Prescription = require("../models/Prescription");
const User = require("../models/User");
const Patient = require("../models/Student");
const { createNotification } = require("./NotificationControllers");

exports.createPrescription = async (req, res) => {
  try {
    const { patientId, medicines, notes } = req.body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: "At least one medicine is required" });
    }

    const contextId = req.user.clinicId || req.user.schoolId || "SCHOOL001";

    const patient = await Patient.findOne({
      $or: [
        { patientId: patientId, clinicId: contextId },
        { studentId: patientId, schoolId: contextId },
      ],
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const prescription = await Prescription.create({
      patientId: patient._id,
      clinicId: contextId,
      prescribedBy: req.user._id,
      doctorId: req.user.staffId || req.user._id.toString(),
      doctorName: req.user.name,
      medicines,
      notes,
      status: "Active",
    });

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate("patientId", "fullName patientId studentId age gender")
      .populate("prescribedBy", "name staffId");

    
    const pharmacists = await User.find({ role: "pharmacist" });
    for (const pharmacist of pharmacists) {
      await createNotification({
        userId:    pharmacist._id,
        type:      "prescription",
        title:     "New Prescription",
        message:   `Dr. ${req.user.name} prescribed medicine for ${patient.fullName || patient.studentId}`,
        patientId: patient.studentId || patient.patientId,  
        severity:  "medium",
      });
    }

    res.status(201).json({
      message: `Prescription created successfully${pharmacists.length > 0 ? ` and ${pharmacists.length} pharmacist(s) notified` : ""}`,
      prescription: populatedPrescription,
    });
  } catch (err) {
    console.error("❌ Error creating prescription:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllPrescriptions = async (req, res) => {
  try {
    const contextId = req.user.clinicId || req.user.schoolId || "SCHOOL001";

    
    const prescriptions = await Prescription.find({
      $or: [
        { clinicId: contextId },
        { clinicId: contextId.toString() },
      ],
    })
      .populate("patientId", "fullName patientId studentId age gender")
      .populate("prescribedBy", "name staffId")
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    console.error("❌ Error fetching prescriptions:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const contextId = req.user.clinicId || req.user.schoolId || "SCHOOL001";

    const patient = await Patient.findOne({
      $or: [
        { patientId, clinicId: contextId },
        { studentId: patientId, schoolId: contextId },
      ],
    });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const prescriptions = await Prescription.find({
      patientId: patient._id,
      $or: [
        { clinicId: contextId },
        { clinicId: contextId.toString() },
      ],
    })
      .populate("prescribedBy", "name staffId")
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePrescription = async (req, res) => {
  try {
    const existing = await Prescription.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Prescription not found" });

    const contextId = req.user.clinicId || req.user.schoolId || "SCHOOL001";
    if (existing.clinicId.toString() !== contextId.toString()) {
      return res.status(403).json({ message: "Unauthorized access to this prescription" });
    }

    if (req.user.role === "pharmacist") {
      if (req.body.medicines) {
        return res.status(403).json({ message: "Pharmacists can only update prescription status" });
      }
      const allowedUpdates = {};
      if (req.body.status)        allowedUpdates.status       = req.body.status;
      if (req.body.dispensedBy)   allowedUpdates.dispensedBy  = req.body.dispensedBy;
      if (req.body.dispensedDate) allowedUpdates.dispensedDate = req.body.dispensedDate;
      if (req.body.status === "Completed") allowedUpdates.completedDate = new Date();
      req.body = allowedUpdates;
    }

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("patientId", "fullName patientId studentId age gender")
      .populate("prescribedBy", "name staffId");

    
    if (req.body.status === "Dispensed" || req.body.status === "Completed") {
      try {
        const HealthVisit = require("../models/HealthVisit");
        const patientDoc = await Patient.findById(existing.patientId);
        const studentId  = patientDoc?.studentId || patientDoc?.patientId;

        
        const recentVisit = studentId
          ? await HealthVisit.findOne({ studentId }).sort({ createdAt: -1 })
          : null;

        const statusLabel = req.body.status === "Dispensed" ? "dispensed" : "completed";
        const notifTitle  = req.body.status === "Dispensed" ? "Prescription Dispensed" : "Prescription Completed";
        const patientName = patientDoc?.fullName || patientDoc?.studentId || "Patient";
        const notifMsg    = `Prescription for ${patientName} has been ${statusLabel} by the pharmacist`;

        if (recentVisit?.attendedBy?.nurse) {
          await createNotification({
            userId:    recentVisit.attendedBy.nurse,
            type:      "general",
            title:     notifTitle,
            message:   notifMsg,
            patientId: studentId,
            severity:  "medium",
          });
        }

        if (recentVisit?.attendedBy?.doctor) {
          await createNotification({
            userId:    recentVisit.attendedBy.doctor,
            type:      "general",
            title:     notifTitle,
            message:   notifMsg,
            patientId: studentId,
            severity:  "medium",
          });
        }

        if (req.body.status === "Dispensed" && recentVisit) {
          await HealthVisit.findByIdAndUpdate(recentVisit._id, { status: "completed" });
        }
      } catch (notifErr) {
        console.error("Error sending dispense notifications:", notifErr);
      }
    }

    res.json({ message: "Prescription updated", prescription });
  } catch (err) {
    console.error("❌ Error updating prescription:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deletePrescription = async (req, res) => {
  try {
    const existing = await Prescription.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Prescription not found" });

    const contextId = req.user.clinicId || req.user.schoolId || "SCHOOL001";
    if (existing.clinicId.toString() !== contextId.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    if (existing.prescribedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the prescribing doctor can delete this prescription" });
    }

    await Prescription.findByIdAndDelete(req.params.id);
    res.json({ message: "Prescription deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};