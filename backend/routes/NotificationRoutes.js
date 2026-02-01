const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require("../controllers/NotificationControllers");


router.get("/", protect, getNotifications);


router.put("/:id/read", protect, markAsRead);


router.put("/mark-all-read", protect, markAllAsRead);

module.exports = router;