const MedicalHistory = require('../models/MedicalHistory');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { createNotification } = require('./NotificationControllers');

/**
 * Create a new medical history record
 * - Doctors create consultations → Notify pharmacists
 * - Nurses flag patients → Notify doctors
 */
exports.createRecord = async (req, res) => {
  try {
    const {
      patientId,
      diagnosis,
      symptoms,
      treatment,
      vitals,
      notes,
      followUpDate,
      requiresDoctorAttention,
      severity
    } = req.body;

    // Find patient by custom patientId field and verify clinic membership
    const patient = await Patient.findOne({ 
      patientId,
      clinicId: req.user.clinicId 
    });
    
    if (!patient) {
      return res.status(404).json({ 
        message: "Patient not found in your clinic" 
      });
    }

    // Create the medical history record
    const record = await MedicalHistory.create({
      patientId: patient._id, // Use MongoDB _id, not custom patientId
      clinicId: req.user.clinicId,
      diagnosis,
      symptoms,
      treatment,
      vitals,
      notes,
      followUpDate,
      recordedBy: req.user._id,
      staffName: req.user.name,
      staffRole: req.user.role,
      requiresDoctorAttention: requiresDoctorAttention || false,
      severity: severity || 'low'
    });

    // Populate the record for response
    const populatedRecord = await MedicalHistory.findById(record._id)
      .populate('patientId', 'fullName patientId age gender')
      .populate('recordedBy', 'name staffId role');

    // NOTIFICATION LOGIC
    
    // 1. If DOCTOR creates a consultation → Notify PHARMACISTS
    if (req.user.role === 'doctor') {
      try {
        const pharmacists = await User.find({ 
          clinicId: req.user.clinicId, 
          role: 'pharmacist' 
        });
        
        const pharmacistNotifications = pharmacists.map(pharmacist => 
          createNotification({
            userId: pharmacist._id,
            clinicId: req.user.clinicId,
            type: 'consultation',
            title: 'New Patient Consultation',
            message: `Dr. ${req.user.name} consulted with ${patient.fullName} - Diagnosis: ${diagnosis}`,
            relatedId: record._id,
            relatedModel: 'MedicalHistory',
            patientId: patient._id,
            severity: severity || 'low',
            isRead: false
          })
        );

        await Promise.all(pharmacistNotifications);
        console.log(`✅ Consultation notification sent to ${pharmacists.length} pharmacists`);
      } catch (notificationError) {
        console.error('❌ Error notifying pharmacists:', notificationError);
        // Don't fail the request if notifications fail
      }
    }

    // 2. If NURSE flags patient for doctor attention → Notify DOCTORS
    if (requiresDoctorAttention && req.user.role === 'nurse') {
      try {
        const doctors = await User.find({ 
          clinicId: req.user.clinicId, 
          role: 'doctor' 
        });
        
        const doctorNotifications = doctors.map(doctor => 
          createNotification({
            userId: doctor._id,
            clinicId: req.user.clinicId,
            type: 'patient_alert',
            title: 'Patient Requires Doctor Attention',
            message: `${req.user.name} (Nurse) reports ${patient.fullName} requires attention - ${diagnosis || symptoms}`,
            relatedId: record._id,
            relatedModel: 'MedicalHistory',
            patientId: patient._id,
            severity: severity || 'medium',
            isRead: false
          })
        );

        await Promise.all(doctorNotifications);
        console.log(`✅ Alert notification sent to ${doctors.length} doctors`);
      } catch (notificationError) {
        console.error('❌ Error notifying doctors:', notificationError);
        // Don't fail the request if notifications fail
      }
    }

    // 3. If OTHER STAFF flags patient for doctor attention → Notify DOCTORS
    if (requiresDoctorAttention && req.user.role !== 'nurse' && req.user.role !== 'doctor') {
      try {
        const doctors = await User.find({ 
          clinicId: req.user.clinicId, 
          role: 'doctor' 
        });
        
        const doctorNotifications = doctors.map(doctor => 
          createNotification({
            userId: doctor._id,
            clinicId: req.user.clinicId,
            type: 'patient_alert',
            title: 'Patient Requires Doctor Attention',
            message: `${req.user.name} reports ${patient.fullName} requires attention - ${diagnosis || symptoms}`,
            relatedId: record._id,
            relatedModel: 'MedicalHistory',
            patientId: patient._id,
            severity: severity || 'medium',
            isRead: false
          })
        );

        await Promise.all(doctorNotifications);
        console.log(`✅ Alert notification sent to ${doctors.length} doctors`);
      } catch (notificationError) {
        console.error('❌ Error notifying doctors:', notificationError);
      }
    }

    // Send success response
    const responseMessage = requiresDoctorAttention && req.user.role !== 'doctor'
      ? "Medical history recorded and doctors have been notified"
      : req.user.role === 'doctor'
      ? "Consultation recorded and pharmacists have been notified"
      : "Medical history recorded successfully";

    res.status(201).json({
      message: responseMessage,
      record: populatedRecord
    });
  } catch (err) {
    console.error('❌ Error creating medical history record:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all medical history records for a patient
 */
exports.getRecordsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Find patient by custom patientId field and verify clinic membership
    const patient = await Patient.findOne({ 
      patientId,
      clinicId: req.user.clinicId 
    });

    if (!patient) {
      return res.status(404).json({ 
        message: "Patient not found in your clinic" 
      });
    }

    // Get records using MongoDB _id
    const records = await MedicalHistory.find({ 
      patientId: patient._id,
      clinicId: req.user.clinicId 
    })
      .populate('recordedBy', 'name staffId role')
      .populate('patientId', 'fullName patientId age gender')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    console.error('❌ Error fetching medical history:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update a medical history record
 */
exports.updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      diagnosis,
      symptoms,
      treatment,
      vitals,
      notes,
      followUpDate,
      requiresDoctorAttention,
      severity
    } = req.body;

    // Find existing record
    const record = await MedicalHistory.findById(id);
    
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Verify clinic membership
    if (record.clinicId.toString() !== req.user.clinicId.toString()) {
      return res.status(403).json({ 
        message: "Unauthorized access to this record" 
      });
    }

    // Check if we need to notify doctors (only if changing from false to true)
    const shouldNotifyDoctors = requiresDoctorAttention && !record.requiresDoctorAttention;

    // Update the record
    const updatedRecord = await MedicalHistory.findByIdAndUpdate(
      id,
      {
        diagnosis,
        symptoms,
        treatment,
        vitals,
        notes,
        followUpDate,
        requiresDoctorAttention,
        severity
      },
      { new: true, runValidators: true }
    )
      .populate('recordedBy', 'name staffId role')
      .populate('patientId', 'fullName patientId age gender');

    // Send notifications if patient now requires doctor attention
    if (shouldNotifyDoctors) {
      try {
        const patient = await Patient.findById(record.patientId);
        const doctors = await User.find({ 
          clinicId: req.user.clinicId, 
          role: 'doctor' 
        });
        
        const notificationPromises = doctors.map(doctor => 
          createNotification({
            userId: doctor._id,
            clinicId: req.user.clinicId,
            type: 'patient_alert',
            title: `Updated: Patient Requires Attention - ${patient.fullName}`,
            message: `${req.user.name} updated patient status - ${severity ? severity.toUpperCase() + ' severity: ' : ''}${symptoms || diagnosis}`,
            relatedId: record._id,
            relatedModel: 'MedicalHistory',
            patientId: patient._id,
            severity: severity || 'medium',
            isRead: false
          })
        );

        await Promise.all(notificationPromises);
        console.log(`✅ Update notifications sent to ${doctors.length} doctors`);
      } catch (notificationError) {
        console.error('❌ Error creating update notifications:', notificationError);
      }
    }

    res.json({
      message: "Record updated successfully" + 
               (shouldNotifyDoctors ? " and doctors have been notified" : ""),
      record: updatedRecord
    });
  } catch (err) {
    console.error('❌ Error updating medical history:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete a medical history record
 */
exports.deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the record
    const record = await MedicalHistory.findById(id);
    
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Verify clinic membership
    if (record.clinicId.toString() !== req.user.clinicId.toString()) {
      return res.status(403).json({ 
        message: "Unauthorized access to this record" 
      });
    }

    // Only the creator or a doctor can delete
    if (record.recordedBy.toString() !== req.user._id.toString() && req.user.role !== 'doctor') {
      return res.status(403).json({ 
        message: "Only the creator or a doctor can delete this record" 
      });
    }

    // Delete the record
    await MedicalHistory.findByIdAndDelete(id);

    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error('❌ Error deleting medical history:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all medical history records for the clinic (admin/doctor view)
 */
exports.getAllRecords = async (req, res) => {
  try {
    // Only doctors and admins can view all records
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: "Unauthorized: Only doctors and admins can view all records" 
      });
    }

    const records = await MedicalHistory.find({ 
      clinicId: req.user.clinicId 
    })
      .populate('recordedBy', 'name staffId role')
      .populate('patientId', 'fullName patientId age gender')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to most recent 100 records

    res.json(records);
  } catch (err) {
    console.error('❌ Error fetching all medical history:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get records that require doctor attention
 */
exports.getRecordsRequiringAttention = async (req, res) => {
  try {
    // Only doctors can view this
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ 
        message: "Unauthorized: Only doctors can view this" 
      });
    }

    const records = await MedicalHistory.find({ 
      clinicId: req.user.clinicId,
      requiresDoctorAttention: true 
    })
      .populate('recordedBy', 'name staffId role')
      .populate('patientId', 'fullName patientId age gender phone')
      .sort({ severity: -1, createdAt: -1 }); // High severity first

    res.json(records);
  } catch (err) {
    console.error('❌ Error fetching records requiring attention:', err);
    res.status(500).json({ message: err.message });
  }
};