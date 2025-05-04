const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const chatSchema = new Schema({
  message: String,
  sender: { type: String, required: true }, // Change to String for phone number reference
  receiver: { type: String, required: true }, // Change to String for phone number reference
  image: String,
  timestamp: { type: Date, default: Date.now },
  deletedBy: { type: [String], default: [] }, // Store deletedBy as an array of phone numbers
  status: { type: String, default: "sent" }, // 'sent', 'received', 'seen'
  edited: { type: Boolean, default: false },
  deletedForEveryone: { type: Boolean, default: false },
});

const Chat = model("Chat", chatSchema);
module.exports = Chat;
