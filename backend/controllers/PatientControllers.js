const Patient = require("../models/Patient");

// Create a new patient
exports.createPatient = async (req, res) => {
  try {
    const {
      fullName,
      age,
      gender,
      address,
      phone,
      emergencyContact,
      medicalHistory,
      allergies,
      bloodGroup
    } = req.body;

    // Validate required fields
    if (!fullName || !age || !gender || !address || !phone) {
      return res.status(400).json({ 
        message: "Missing required fields: fullName, age, gender, address, phone" 
      });
    }

    // Generate unique patient ID
    const patientId = "PAT-" + Date.now() + Math.floor(Math.random() * 1000);

    const patient = await Patient.create({
      patientId,
      fullName,
      age,
      gender,
      address,
      phone,
      emergencyContact: emergencyContact || {},
      medicalHistory: medicalHistory || "",
      allergies: allergies || "",
      bloodGroup: bloodGroup || "Unknown",
      createdBy: req.user.id,
      clinicId: req.user.clinicId
    });

    console.log(`✅ Patient created: ${patient.patientId} by user: ${req.user.id}`);

    res.status(201).json({
      message: "Patient created successfully",
      patient
    });

  } catch (err) {
    console.error("❌ Error creating patient:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all patients for a clinic
exports.getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({
      clinicId: req.user.clinicId
    }).sort({ createdAt: -1 }); // Most recent first

    console.log(`✅ Retrieved ${patients.length} patients for clinic: ${req.user.clinicId}`);

    res.json(patients);

  } catch (err) {
    console.error("❌ Error fetching patients:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get a single patient
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      patientId: req.params.patientId,
      clinicId: req.user.clinicId
    }).populate('createdBy', 'name role');

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    console.log(`✅ Retrieved patient: ${patient.patientId}`);

    res.json(patient);

  } catch (err) {
    console.error("❌ Error fetching patient:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update patient information
exports.updatePatient = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated this way
    delete updateData.patientId;
    delete updateData.clinicId;
    delete updateData.createdBy;

    const patient = await Patient.findOneAndUpdate(
      {
        patientId: req.params.patientId,
        clinicId: req.user.clinicId
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    console.log(`✅ Updated patient: ${patient.patientId}`);

    res.json({ 
      message: "Patient updated successfully", 
      patient 
    });

  } catch (err) {
    console.error("❌ Error updating patient:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete patient
exports.deletePatient = async (req, res) => {
  try {
    const deleted = await Patient.findOneAndDelete({
      patientId: req.params.patientId,
      clinicId: req.user.clinicId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Patient not found" });
    }

    console.log(`✅ Deleted patient: ${deleted.patientId}`);

    res.json({ message: "Patient deleted successfully" });

  } catch (err) {
    console.error("❌ Error deleting patient:", err);
    res.status(500).json({ message: err.message });
  }
};

// Hospitalize a patient
exports.hospitalizePatient = async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { 
        patientId: req.params.patientId, 
        clinicId: req.user.clinicId 
      },
      { 
        hospitalized: true,
        hospitalizedDate: new Date(),
        status: "Active"
      },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    console.log(`✅ Hospitalized patient: ${patient.patientId}`);

    res.json({ 
      message: "Patient hospitalized successfully", 
      patient 
    });

  } catch (err) {
    console.error("❌ Error hospitalizing patient:", err);
    res.status(500).json({ message: err.message });
  }
};

// Refer a patient
exports.referPatient = async (req, res) => {
  try {
    const { referredTo, referralReason } = req.body;

    if (!referredTo || !referralReason) {
      return res.status(400).json({ 
        message: "Referred to and referral reason are required" 
      });
    }

    const patient = await Patient.findOneAndUpdate(
      { 
        patientId: req.params.patientId, 
        clinicId: req.user.clinicId 
      },
      { 
        referredTo, 
        referralReason,
        referralDate: new Date(),
        status: "Referred"
      },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    console.log(`✅ Referred patient: ${patient.patientId} to ${referredTo}`);

    res.json({ 
      message: "Patient referred successfully", 
      patient 
    });

  } catch (err) {
    console.error("❌ Error referring patient:", err);
    res.status(500).json({ message: err.message });
  }
};