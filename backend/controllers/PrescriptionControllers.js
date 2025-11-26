const Prescription = require("../models/Prescription");


exports.createPrescription = async (req, res) => {
  try {
    const { patientId, medicines, notes } = req.body;

    const prescription = await Prescription.create({
      patientId,
      clinicId: req.user.clinicId,
      prescribedBy: req.user._id,
      medicines,
      notes
    });

    res.status(201).json({ message: "Prescription created", prescription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patientId: req.params.patientId,
      clinicId: req.user.clinicId
    });

    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    res.json({ message: "Prescription updated", prescription });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deletePrescription = async (req, res) => {
  try {
    const deleted = await Prescription.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Prescription not found" });

    res.json({ message: "Prescription deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
