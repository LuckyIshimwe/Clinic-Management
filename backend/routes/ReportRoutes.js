const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

const {
  getClinicPatients,
  getClinicLabRequests,
  getClinicPrescriptions
} = require("../controllers/ReportControllers");


router.get("/patients", protect, authorizeRoles("doctor", "admin"), getClinicPatients);
router.get("/labs", protect, authorizeRoles("doctor", "admin"), getClinicLabRequests);
router.get("/prescriptions", protect, authorizeRoles("doctor", "admin"), getClinicPrescriptions);

module.exports = router;
