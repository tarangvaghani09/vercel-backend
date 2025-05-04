const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

// Group Schema

const groupSchema = new Schema({
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
});

const Group = new model('Group', groupSchema);
module.exports = Group;