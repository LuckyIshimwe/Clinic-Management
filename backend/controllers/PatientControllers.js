const Patient = require("../models/Patient");


exports.createPatient = async (req, res) => {
  try {
    const {
      fullName,
      age,
      gender,
      address,
      phone,
      emergencyContact,
      medicalHistory
    } = req.body;

    const patientId = "PAT-" + Math.floor(Math.random() * 999999);

    const patient = await Patient.create({
      patientId,
      fullName,
      age,
      gender,
      address,
      phone,
      emergencyContact,
      medicalHistory,
      createdBy: req.user.id,
      clinicId: req.user.clinicId
    });

    res.status(201).json({
      message: "Patient created",
      patient
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({
      clinicId: req.user.clinicId
    });

    res.json(patients);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      patientId: req.params.patientId,
      clinicId: req.user.clinicId
    });

    if (!patient)
      return res.status(404).json({ message: "Patient not found" });

    res.json(patient);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      {
        patientId: req.params.patientId,
        clinicId: req.user.clinicId
      },
      req.body,
      { new: true }
    );

    if (!patient)
      return res.status(404).json({ message: "Patient not found" });

    res.json({ message: "Patient updated", patient });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




exports.deletePatient = async (req, res) => {
  try {
    const deleted = await Patient.findOneAndDelete({
      patientId: req.params.patientId,
      clinicId: req.user.clinicId
    });

    if (!deleted)
      return res.status(404).json({ message: "Patient not found" });

    res.json({ message: "Patient deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.hospitalizePatient = async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { patientId: req.params.patientId, clinicId: req.user.clinicId },
      { hospitalized: true },
      { new: true }
    );

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    res.json({ message: "Patient hospitalized", patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.referPatient = async (req, res) => {
  try {
    const { referredTo, referralReason } = req.body;

    const patient = await Patient.findOneAndUpdate(
      { patientId: req.params.patientId, clinicId: req.user.clinicId },
      { referredTo, referralReason },
      { new: true }
    );

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    res.json({ message: "Patient referred", patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
