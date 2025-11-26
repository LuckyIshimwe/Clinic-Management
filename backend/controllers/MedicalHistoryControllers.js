const MedicalHistory = require("../models/MedicalHistory");


exports.createRecord = async (req, res) => {
  try {
    const { patientId, diagnosis, treatment, allergies, notes } = req.body;

    const record = await MedicalHistory.create({
      patientId,
      clinicId: req.user.clinicId,
      createdBy: req.user._id,
      diagnosis,
      treatment,
      allergies,
      notes
    });

    res.status(201).json({ message: "Medical history record created", record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getRecordsByPatient = async (req, res) => {
  try {
    const records = await MedicalHistory.find({
      patientId: req.params.patientId,
      clinicId: req.user.clinicId
    });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateRecord = async (req, res) => {
  try {
    const record = await MedicalHistory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!record) return res.status(404).json({ message: "Record not found" });

    res.json({ message: "Record updated", record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deleteRecord = async (req, res) => {
  try {
    const deleted = await MedicalHistory.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Record not found" });

    res.json({ message: "Record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
