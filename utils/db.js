// MongoDB connection
const mongoose = require("mongoose");

// mongoose.connect('mongodb://localhost:27017/chat-app', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });


const URI = process.env.MONGODB_URI;

// const connectDb = async () => {
//   try {
//     await mongoose.connect("mongodb+srv://skguser2514:mongodb251@cluster0.kiawi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
//     console.log("Connected to MongoDB");
//   } catch (err) {
//     console.error("Failed to connect to MongoDB:", err.message);
//     process.exit(1);
//   }
// }





const connectDb = async () => {
  try {
    await mongoose.connect(URI,{
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("connect to db");
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(0);
  }
};

module.exports = connectDb;
