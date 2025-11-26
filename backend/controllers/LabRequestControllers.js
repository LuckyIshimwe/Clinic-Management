const LabRequest = require("../models/LabRequest");


exports.createLabRequest = async (req, res) => {
  try {
    const { patientId, testType } = req.body;

    if (!patientId || !testType) {
      return res.status(400).json({ message: "patientId and testType are required" });
    }

    const labRequest = await LabRequest.create({
      patientId,
      clinicId: req.user.clinicId,
      requestedBy: req.user._id,
      testType,
      status: "pending"
    });

    res.status(201).json({ message: "Lab request created", labRequest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLabRequests = async (req, res) => {
  try {
    const { status, patientId } = req.query;
    const filter = { clinicId: req.user.clinicId };

    if (status) filter.status = status;
    if (patientId) filter.patientId = patientId;

    const requests = await LabRequest.find(filter);
    res.json({ total: requests.length, requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateLabRequest = async (req, res) => {
  try {
    const { status } = req.body;

   
    if (status && !["pending", "in-progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const labRequest = await LabRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!labRequest) return res.status(404).json({ message: "Lab request not found" });

    res.json({ message: "Lab request updated", labRequest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deleteLabRequest = async (req, res) => {
  try {
    const deleted = await LabRequest.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Lab request not found" });

    res.json({ message: "Lab request deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getLabRequestsByPatient = async (req, res) => {
  try {
    const requests = await LabRequest.find({
      clinicId: req.user.clinicId,
      patientId: req.params.patientId
    });

    res.json({ total: requests.length, requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
