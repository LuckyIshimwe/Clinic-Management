const mongoose = require("mongoose");

const clinicSchema = new mongoose.Schema({
  clinicId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Clinic", clinicSchema);
