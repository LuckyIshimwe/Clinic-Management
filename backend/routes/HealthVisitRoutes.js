const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const {
  createHealthVisit,
  getHealthVisitsByStudent,
  updateHealthVisit,
  getLabPendingVisits,
  getLabCompletedVisits,
  submitLabResults,
  getDoctorPendingReviews,
  submitDoctorReview,
  getAllVisits
} = require("../controllers/HealthVisitControllers");


router.post("/", protect, authorizeRoles("nurse"), createHealthVisit);


router.get("/student/:studentId", protect, getHealthVisitsByStudent);


router.get("/all", protect, authorizeRoles("doctor", "admin"), getAllVisits);


router.get("/lab/pending", protect, authorizeRoles("lab_technician"), getLabPendingVisits);
router.get("/lab/completed", protect, authorizeRoles("lab_technician"), getLabCompletedVisits);
router.put("/:id/lab-results", protect, authorizeRoles("lab_technician"), submitLabResults);


router.get("/doctor/pending", protect, authorizeRoles("doctor"), getDoctorPendingReviews);
router.put("/:id/doctor-review", protect, authorizeRoles("doctor"), submitDoctorReview);


router.put("/:id", protect, authorizeRoles("nurse", "doctor", "lab_technician"), updateHealthVisit);

module.exports = router;