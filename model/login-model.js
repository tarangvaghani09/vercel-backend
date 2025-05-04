// Login Schema

const { Schema, model } = require("mongoose");

const loginSchema = new Schema({
  // username: { type: String, unique: true, required: true },
  username: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  ipAddress: String,
  createdAt: { type: Date, default: Date.now },
});

const Login = new model("Login", loginSchema);
module.exports = Login;
