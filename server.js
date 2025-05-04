// server.js (backend entry file)
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();
const server = http.createServer(app);
const authRoute = require("./router/auth-router");
const connectDb = require("./utils/db");
const Chat = require("./model/chat-model"); // Ensure you import Chat model
const configureSocket = require("./socketio");
const PORT = process.env.PORT || 5000;
const fs = require("fs");

// const io = new Server(server, {
//     cors: {
//         origin: 'http://localhost:5173',
//         methods: ['GET', 'POST'],
//     },
// });

const io = configureSocket(server);

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api", authRoute);

// // Socket.io events
// io.on('connection', (socket) => {
//     console.log('a user connected');

//     socket.on('sendMessage', async (data) => {
//         const chat = new Chat(data);
//         await chat.save();
//         io.emit('receiveMessage', chat);
//     });

//     socket.on('deleteMessage', async ({ id, user, deleteForBoth }) => {
//         if (deleteForBoth) {
//             await Chat.findByIdAndDelete(id);
//         } else {
//             await Chat.findByIdAndUpdate(id, { $push: { deletedBy: user } });
//         }
//         io.emit('messageDeleted', { id, user, deleteForBoth });
//     });

//     socket.on('disconnect', () => {
//         console.log('user disconnected');
//     });
// });

// Configure Multer storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//       cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//       cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage: storage });

// app.post('/upload', upload.single('image'), (req, res) => {
//   if (!req.file) {
//       return res.status(400).send({ error: 'No file uploaded' });
//   }
//   res.send({ imageUrl: `http://localhost:5000/uploads/${req.file.filename}` });
// });

// app.use('/uploads', express.static('uploads'));

// Serve static files (uploaded images)
app.use("/uploads", express.static("uploads"));

// // Handle file download request
// app.get('/download/:fileName', (req, res) => {
//   const fileName = req.params.fileName;
//   const filePath = path.join(__dirname, 'uploads', fileName);
//   res.download(filePath, fileName);
// });

// Endpoint to handle download requests for PDF and image files
app.get("/download/uploads/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, "uploads", fileName);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Set headers to force download
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Pipe the file stream to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    res.status(404).json({ message: "File not found" });
  }
});

connectDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is listening on port http://localhost:${PORT}`);
  });
});

module.exports = io; // Export io to use in routes
