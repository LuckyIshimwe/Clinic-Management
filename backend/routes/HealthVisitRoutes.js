

const express = require("express");
const router  = express.Router();
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
  getAllVisits,
  
  getNurseLabCompletedVisits,
  nurseLabFollowup,
} = require("../controllers/HealthVisitControllers");



router.post("/", protect, authorizeRoles("nurse"), createHealthVisit);


router.get("/all", protect, authorizeRoles("doctor", "admin", "nurse"), getAllVisits);


router.get("/nurse/lab-completed", protect, authorizeRoles("nurse"), getNurseLabCompletedVisits);


router.get("/lab/pending",    protect, authorizeRoles("labtechnician"), getLabPendingVisits);
router.get("/lab/completed",  protect, authorizeRoles("labtechnician"), getLabCompletedVisits);
router.put("/:id/lab-results", protect, authorizeRoles("labtechnician"), submitLabResults);


router.get("/doctor/pending",    protect, authorizeRoles("doctor"), getDoctorPendingReviews);
router.put("/:id/doctor-review", protect, authorizeRoles("doctor"), submitDoctorReview);


router.put("/:id/nurse-lab-followup", protect, authorizeRoles("nurse"), nurseLabFollowup);


router.put("/:id", protect, authorizeRoles("nurse", "doctor", "labtechnician"), updateHealthVisit);


router.get("/student/:studentId", protect, getHealthVisitsByStudent);

module.exports = router;