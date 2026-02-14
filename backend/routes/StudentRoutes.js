const express = require("express");
const router = express.Router();
const multer = require('multer');
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const {
  registerStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents
} = require("../controllers/StudentControllers");


const upload = multer({ dest: 'uploads/' });

router.post("/", protect, authorizeRoles("nurse", "admin"), registerStudent);


router.get("/", protect, getStudents);


router.post(
  "/bulk-import", 
  protect, 
  authorizeRoles("nurse", "admin"), 
  upload.single('file'), 
  bulkImportStudents
);


router.get("/:studentId", protect, getStudent);


router.put("/:studentId", protect, authorizeRoles("nurse", "admin"), updateStudent);


router.delete("/:studentId", protect, authorizeRoles("nurse", "admin"), deleteStudent);

module.exports = router;