const express = require("express");
const router = express.Router();
// const multer = require('multer');
const chatcontrollers = require("../controller/chat-controller");
// const createUserSchema = require("../model/user-model");
const verifyToken = require("../middleware/auth-middleware");
const upload = require("../middleware/upload-middleware");
// const upload = multer({ dest: 'uploads/' });
// router.route("/").get(chatcontrollers.home);
// const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/"); // The directory where images will be stored
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "-" + file.originalname); // Naming the file
//   },
// });

// const upload = multer({ storage: storage });

router
  .route("/updateprofile")
  .put(upload.single("profilePicture"), chatcontrollers.updateprofile);

router
  .route("/register")
  .post(upload.single("profilePicture"), chatcontrollers.register);

router.route("/register").get(chatcontrollers.phoneRegister);

router.route("/registerUser").get(chatcontrollers.registerUser);

router.route("/latestmessage").get(chatcontrollers.latestMessage);

router.route("/login").post(chatcontrollers.login);

router.route("/getChats/").get(verifyToken, chatcontrollers.getChats);
// router.route("/getChats/:username").get(verifyToken,chatcontrollers.getChats);

router.route("/chats").post(upload.single("image"), chatcontrollers.chats);

router.route("/editChat/:id").put(chatcontrollers.editChats);

router.route("/chatsDelete/:id").post(chatcontrollers.chatsDelete);

router.route("/payment").post(chatcontrollers.paymentAdd);

router.route("/send-otp").post(chatcontrollers.sendOtp);

router.route("/verify-otp").post(chatcontrollers.verifyOtp);

router.route("/contacts").get(chatcontrollers.getContacts);

router.route("/addContact").post(chatcontrollers.addContact);

router.route("/removeContact").delete(chatcontrollers.removeContact);

router.route("/updateContact").put(chatcontrollers.updateContact);

router.route("/addUnknownContact").post(chatcontrollers.addUnknownContact);

router.route("/removeUnknownContact").delete(chatcontrollers.removeUnknownContact);

router.route("/block").put(chatcontrollers.block);

router.route("/unblock").put(chatcontrollers.unblock);

router.route("/trends/:category").get(chatcontrollers.trend);



// router.get("/:username", async (req, res) => {
//     const { username } = req.params;
//     const userSchema = createUserSchema(username);
//     try {
//       const messages = await userSchema.find();
//       res.json(messages);
//     } catch (error) {
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   });

module.exports = router;



