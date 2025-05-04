// // contacts-model.js
// const mongoose = require("mongoose");
// const { Schema, model } = mongoose;

// const contactSchema = new Schema({
//   owner: { type: String, required: true, unique: true }, // Logged-in user's phone number
//   contacts: [{ type: String }] // Array of contact phone numbers
// });

// const Contact = model("Contact", contactSchema);
// module.exports = Contact;



const mongoose = require("mongoose");
const { Schema, model } = mongoose;

// Define a sub-schema for a single contact
const singleContactSchema = new Schema({
  contactUsername: { type: String, required: true },
  contactPhone: { type: String, required: true },
  isBlocked: { type: Boolean, default: false }, // New field to store blocked status
});

// Main contacts schema for a user’s contact list
const contactSchema = new Schema({
  owner: { type: String, required: true, unique: true }, // Logged-in user's phone number
  contacts: [singleContactSchema], // Array of saved contact objects
  unknownContacts: [singleContactSchema], // New array for storing unknown numbers
});

const Contact = model("Contact", contactSchema);
module.exports = Contact;

