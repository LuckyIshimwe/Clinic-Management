const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


function detectRoleFromId(userId) {
  const id = userId.toLowerCase();

  if (id.includes("admin")) return "admin";
  if (id.includes("doc")) return "doctor";
  if (id.includes("nur")) return "nurse";
  if (id.includes("lab")) return "lab";

  return "staff";
}


exports.registerUser = async (req, res) => {
  try {
    const { staffId, name, email, password, clinicId, specialization,role } = req.body;

    if (!staffId || !name || !email || !password || !clinicId||!role)
      return res.status(400).json({ message: "All fields are required" });

    
    const exists = await User.findOne({ $or: [{ staffId }, { email }] });
    if (exists)
      return res.status(400).json({ message: "User with this staffId or email already exists" });

   
   

   
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const user = await User.create({
      staffId,
      name,
      email,
      password: hashedPassword,
      clinicId,
      role,
      specialization
    });

    res.status(201).json({
      message: "User registered",
      user: {
        id: user._id,
        staffId: user.staffId,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const {staffId, password } = req.body;

    const user = await User.findOne({ staffId });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        clinicId: user.clinicId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      fullName: user.fullName
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.getUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




exports.updateUser = async (req, res) => {
  try {
    const { fullName, password } = req.body;
    const updates = { fullName };

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true }
    ).select("-password");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated", user });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.userId);

    if (!deleted)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
