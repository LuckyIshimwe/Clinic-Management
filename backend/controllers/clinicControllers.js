const Clinic = require("../models/Clinic");

exports.createClinic = async (req, res) => {
  try {
    const { clinicId, name, address, phone, email } = req.body;
    if (!clinicId || !name || !address || !phone || !email) 
      return res.status(400).json({ message: "All fields are required" });

    const exists = await Clinic.findOne({ email });
    if (exists) return res.status(400).json({ message: "Clinic already exists" });

    const clinic = await Clinic.create({ name, address, phone, email });
    res.status(201).json({ message: "Clinic created", clinic });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getClinics = async (req, res) => {
  try {
    const clinics = await Clinic.find();
    res.json(clinics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getClinicById = async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) return res.status(404).json({ message: "Clinic not found" });
    res.json(clinic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateClinic = async (req, res) => {
  try {
    const {clinicId, name, address, phone, email } = req.body;
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      { clinicId ,name, address, phone, email },
      { new: true }
    );
    if (!clinic) return res.status(404).json({ message: "Clinic not found" });
    res.json({ message: "Clinic updated", clinic });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteClinic = async (req, res) => {
  try {
    const deleted = await Clinic.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Clinic not found" });
    res.json({ message: "Clinic deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
