const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

const {
  createRecord,
  getRecordsByPatient,
  updateRecord,
  deleteRecord
} = require("../controllers/MedicalHistoryControllers");


router.post("/", protect, authorizeRoles("nurse"), createRecord);


router.get("/:patientId", protect, getRecordsByPatient);


router.put("/:id", protect, authorizeRoles("doctor", "nurse"), updateRecord);

router.delete("/:id", protect, authorizeRoles("doctor"), deleteRecord);

module.exports = router;
