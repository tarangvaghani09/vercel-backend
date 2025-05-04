// User Schema

// const { Schema, model } = require("mongoose");

// const userSchema = new Schema({
//     username: { type: String, unique: true, required: true },
//     password: { type: String, required: true },
//     mobile: { type: String, unique: true, required: true },
//     otp: String,
//     profilePicture: String,
//     role: { type: String, enum: ['admin', 'user'], default: 'user' },
//     createdAt: { type: Date, default: Date.now },
// });

// const User = new model('User', userSchema);
// module.exports = User;

// // userSchema.js
// const mongoose = require("mongoose");

// const createUserSchema = (username) => {
//   if (username) return;
  
//   const schema = new mongoose.Schema({
//     message: { type: String, required: true },
//     sender: { type: String, required: true },
//     receiver: { type: String, required: true },
//     timestamp: { type: Date, default: Date.now },
//   });

//   return mongoose.model(username, schema);
// };

// module.exports = createUserSchema;
