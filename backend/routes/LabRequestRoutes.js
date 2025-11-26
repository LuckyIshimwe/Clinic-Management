const express = require("express");
const router = express.Router();


const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authMiddleware"); 


const {
  createLabRequest,
  getLabRequests,
  updateLabRequest,
  deleteLabRequest,
  getLabRequestsByPatient
} = require("../controllers/LabRequestControllers"); 


router.post("/", protect, authorizeRoles("nurse"), createLabRequest);


router.get("/", protect, authorizeRoles("labtech"), getLabRequests);

router.put("/:id", protect, authorizeRoles("labtech"), updateLabRequest);


router.delete("/:id", protect, authorizeRoles("labtech", "admin"), deleteLabRequest);


router.get("/patient/:patientId", protect, authorizeRoles("doctor", "nurse"), getLabRequestsByPatient);

module.exports = router;
