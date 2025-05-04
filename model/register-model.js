const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const registerSchema = new Schema({
  username: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: null },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  createdAt: { type: Date, default: Date.now },
  otp: { type: String }, // Store OTP temporarily
  otpExpires: { type: Date }, // OTP expiration time
});

const Register = model("Register", registerSchema);
module.exports = Register;
