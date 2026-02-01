const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware");

const {
  createRecord,
  getRecordsByPatient,
  updateRecord,
  deleteRecord,
  getAllRecords,
  getRecordsRequiringAttention
} = require("../controllers/MedicalHistoryControllers");


router.post("/", protect, authorizeRoles("doctor", "nurse"), createRecord);


router.get("/:patientId", protect, getRecordsByPatient);


router.put("/:id", protect, authorizeRoles("doctor", "nurse"), updateRecord);

router.delete("/:id", protect, authorizeRoles("doctor"), deleteRecord);
router.get("/all/clinic", protect, authorizeRoles("doctor", "admin"), getAllRecords);


router.get("/attention/required", protect, authorizeRoles("doctor"), getRecordsRequiringAttention);


module.exports = router;
