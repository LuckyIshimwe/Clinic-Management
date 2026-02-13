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

   
    const patient = await Patient.findOne({ 
      patientId: patientId,
      clinicId: req.user.clinicId 
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found in your clinic" });
    }

    console.log('Creating prescription for patient:', patient._id);
    console.log('Clinic ID from user:', req.user.clinicId);
    console.log('Clinic ID type:', typeof req.user.clinicId);

    
    const prescription = await Prescription.create({
      patientId: patient._id, 
      clinicId: req.user.clinicId, 
      prescribedBy: req.user._id,
      doctorId: req.user.staffId,
      doctorName: req.user.name,
      medicines,
      notes,
      status: 'Active'
    });

    console.log('Prescription created:', prescription._id);

  
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'fullName patientId age gender')
      .populate('prescribedBy', 'name staffId');

    
    const pharmacists = await User.find({ 
      clinicId: req.user.clinicId, 
      role: 'pharmacist' 
    });

    console.log(`Found ${pharmacists.length} pharmacists to notify`);

   
    if (pharmacists.length > 0) {
      try {
        for (const pharmacist of pharmacists) {
          await createNotification({
            userId: pharmacist._id,
            clinicId: req.user.clinicId,
            type: 'prescription',
            title: 'New Prescription',
            message: `Dr. ${req.user.name} prescribed medicine for ${patient.fullName}`,
            relatedId: prescription._id,
            relatedModel: 'Prescription',
            patientId: patient._id
          });
        }
        console.log(`✅ Notifications sent to ${pharmacists.length} pharmacists`);
      } catch (notifError) {
        console.error('❌ Error sending notifications:', notifError);
        
      }
    }

    res.status(201).json({ 
      message: "Prescription created successfully" + 
               (pharmacists.length > 0 ? ` and ${pharmacists.length} pharmacist(s) notified` : ""), 
      prescription: populatedPrescription 
    });
  } catch (err) {
    console.error('❌ Error creating prescription:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllPrescriptions = async (req, res) => {
  try {
    console.log('Fetching prescriptions for clinic:', req.user.clinicId);
    console.log('User role:', req.user.role);

  
    const prescriptions = await Prescription.find({ 
      clinicId: req.user.clinicId 
    })
    .populate('patientId', 'fullName patientId age gender phone')
    .populate('prescribedBy', 'name staffId')
    .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${prescriptions.length} prescriptions`);
    
    res.json(prescriptions);
  } catch (err) {
    console.error('❌ Error fetching prescriptions:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    
    const patient = await Patient.findOne({ 
      patientId: patientId,
      clinicId: req.user.clinicId 
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found in your clinic" });
    }

    console.log('Fetching prescriptions for patient:', patient._id);

    
    const prescriptions = await Prescription.find({
      patientId: patient._id, 
      clinicId: req.user.clinicId
    })
    .populate('prescribedBy', 'name staffId')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${prescriptions.length} prescriptions for patient`);

    res.json(prescriptions);
  } catch (err) {
    console.error('❌ Error fetching patient prescriptions:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updatePrescription = async (req, res) => {
  try {
    const existingPrescription = await Prescription.findById(req.params.id);
    
    if (!existingPrescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    console.log('Existing prescription clinicId:', existingPrescription.clinicId);
    console.log('User clinicId:', req.user.clinicId);

    
    const prescriptionClinicId = existingPrescription.clinicId.toString();
    const userClinicId = req.user.clinicId.toString();

    if (prescriptionClinicId !== userClinicId) {
      console.log('❌ Clinic ID mismatch');
      return res.status(403).json({ message: "Unauthorized access to this prescription" });
    }

    
    if (req.user.role === 'pharmacist') {
      
      if (req.body.medicines) {
        return res.status(403).json({ 
          message: "Pharmacists can only update prescription status, not medicines" 
        });
      }
      
     
      const allowedUpdates = {};
      if (req.body.status) allowedUpdates.status = req.body.status;
      if (req.body.dispensedBy) allowedUpdates.dispensedBy = req.body.dispensedBy;
      if (req.body.dispensedDate) allowedUpdates.dispensedDate = req.body.dispensedDate;
      if (req.body.status === 'Completed') allowedUpdates.completedDate = new Date();
      
      req.body = allowedUpdates;
    }

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('patientId', 'fullName patientId age gender')
    .populate('prescribedBy', 'name staffId');

    console.log('✅ Prescription updated:', prescription._id);

    res.json({ message: "Prescription updated", prescription });
  } catch (err) {
    console.error('❌ Error updating prescription:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deletePrescription = async (req, res) => {
  try {
    const existingPrescription = await Prescription.findById(req.params.id);
    
    if (!existingPrescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    
    const prescriptionClinicId = existingPrescription.clinicId.toString();
    const userClinicId = req.user.clinicId.toString();

    if (prescriptionClinicId !== userClinicId) {
      return res.status(403).json({ message: "Unauthorized access to this prescription" });
    }

    
    if (existingPrescription.prescribedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "Only the prescribing doctor can delete this prescription" 
      });
    }

    await Prescription.findByIdAndDelete(req.params.id);

    console.log('✅ Prescription deleted:', req.params.id);

    res.json({ message: "Prescription deleted" });
  } catch (err) {
    console.error('❌ Error deleting prescription:', err);
    res.status(500).json({ message: err.message });
  }
};