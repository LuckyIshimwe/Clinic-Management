const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const {
  registerStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents
} = require("../controllers/StudentControllers");


router.post("/", protect, authorizeRoles("nurse", "admin"), registerStudent);


router.post("/bulk-import", protect, authorizeRoles("admin", "nurse"), bulkImportStudents);


router.get("/", protect, getStudents);


router.get("/:studentId", protect, getStudent);


router.put("/:studentId", protect, authorizeRoles("nurse", "admin"), updateStudent);


router.delete("/:studentId", protect, authorizeRoles("admin"), deleteStudent);

module.exports = router;