const express = require("express");
const router = express.Router();
const {
  createClinic,
  getClinics,
  getClinicById,
  updateClinic,
  deleteClinic
} = require("../controllers/clinicControllers");

router.post("/", createClinic);
router.get("/", getClinics);
router.get("/:id", getClinicById);
router.put("/:id", updateClinic);
router.delete("/:id", deleteClinic);

module.exports = router;
