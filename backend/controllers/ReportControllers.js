const Patient = require("../models/Patient");
const LabRequest = require("../models/LabRequest");
const Prescription = require("../models/Prescription");


exports.getClinicPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ clinicId: req.user.clinicId });
    res.json({ total: patients.length, patients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getClinicLabRequests = async (req, res) => {
  try {
    const labRequests = await LabRequest.find({ clinicId: req.user.clinicId });
    res.json({ total: labRequests.length, labRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getClinicPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ clinicId: req.user.clinicId });
    res.json({ total: prescriptions.length, prescriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
