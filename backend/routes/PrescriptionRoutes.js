const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

const {
  createPrescription,
  getPrescriptionsByPatient,
  updatePrescription,
  deletePrescription
} = require("../controllers/PrescriptionControllers");


router.post("/", protect, authorizeRoles("doctor"), createPrescription);


router.get("/:patientId", protect, getPrescriptionsByPatient);


router.put("/:id", protect, authorizeRoles("doctor"), updatePrescription);


router.delete("/:id", protect, authorizeRoles("doctor"), deletePrescription);

module.exports = router;
