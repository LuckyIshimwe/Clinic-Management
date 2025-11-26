const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require("../controllers/UserControllers");

const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);


router.get("/", protect, getUsers);
router.get("/:userId", protect, getUserById);
router.put("/:userId", protect, updateUser);
router.delete("/:userId", protect, deleteUser);

module.exports = router;
