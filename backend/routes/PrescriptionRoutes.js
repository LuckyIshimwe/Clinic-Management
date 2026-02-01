const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionsByPatient,
  updatePrescription,
  deletePrescription
} = require("../controllers/PrescriptionControllers");


router.post("/", protect, authorizeRoles("doctor"), createPrescription);

router.get("/", protect, authorizeRoles("doctor", "pharmacist"), getAllPrescriptions);

router.get("/:patientId", protect, authorizeRoles("doctor", "pharmacist"), getPrescriptionsByPatient);


router.put("/:id", protect, authorizeRoles("doctor", "pharmacist"), updatePrescription);

router.delete("/:id", protect, authorizeRoles("doctor"), deletePrescription);

module.exports = router;