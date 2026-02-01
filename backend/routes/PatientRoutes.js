const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

const {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
  hospitalizePatient, referPatient 
} = require("../controllers/PatientControllers");


router.post("/", protect, authorizeRoles("nurse", "doctor"), createPatient);


router.get("/get", protect, getPatients);


router.get("/:patientId", protect, getPatient);


router.put("/:patientId", protect, authorizeRoles("doctor", "nurse", "receptionist"), updatePatient);


router.delete("/:patientId", protect, authorizeRoles("doctor", "admin"), deletePatient);
router.put("/:patientId/hospitalize", protect, authorizeRoles("doctor"), hospitalizePatient);


router.put("/:patientId/refer", protect, authorizeRoles("doctor"), referPatient);

module.exports = router;
