const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const io = require("../server"); // Import io from server.js
const Chat = require("../model/chat-model");
const Register = require("../model/register-model");
const Login = require("../model/login-model");
const Group = require("../model/group-model");
const User = require("../model/user-model");
const upload = require("../middleware/upload-middleware");
const Razorpay = require("razorpay");
const twilio = require("twilio");
const Contact = require("../model/contacts-model");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// API routes
// const secretkey = "tarang";

// const generateToken = async()=>{
//     try {
//       const token = jwt.sign({ username }, "secretkey", { expiresIn: "1h" });

//       } catch (error) {
//         console.log(error);
//       }
// }

// const register = async (req, res) => {
//   try {
//     const { username, phone, password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new Register({
//       username,
//       phone,
//       password: hashedPassword,
//     });
//     // const register = new Register({username,phone,password});
//     await newUser.save();
//     const token = jwt.sign({ id: newUser._id }, "secretkey", {
//       expiresIn: "1h",
//     });
//     res.status(201).json({ msg: "Registration succesful", token });
//   } catch (error) {
//     console.log(error);
//   }
// };

// const login = async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const user = await Register.findOne({ username });
//     if (user && (await bcrypt.compare(password, user.password))) {
//       const token = jwt.sign({ id: user._id }, "secretkey", {
//         expiresIn: "1h",
//       });

//       const newLogin = new Login({
//         username,
//         password,
//         // otp,
//         ipAddress: req.ip, // Assuming you have access to the request IP
//         // You can add more fields like userAgent, etc. as needed
//       });

//       await newLogin.save();
//       res.status(201).json({ msg: "Login succesful", token, username });
//     } else {
//       res.status(400).json({ message: "Invalid credentials" });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

const register = async (req, res) => {
  try {
    const { username, phone, password } = req.body;
    const existingUser = await Register.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultProfilePicture = "../uploads/d.webp";
    const newUser = new Register({
      username,
      phone,
      password: hashedPassword,
      profilePicture: req.file ? req.file.path : defaultProfilePicture, // Store the uploaded file path
    });

    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, "secretkey", {
      expiresIn: "1h",
    });

    res.status(201).json({ message: "Registration successful", token });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateprofile = async (req, res) => {
  const { username, newUsername, removeProfilePicture } = req.body;
  const updates = {};

  if (newUsername) {
    updates.username = newUsername;
  }

  if (removeProfilePicture === "true") {
    updates.profilePicture = null;
  } else if (req.file) {
    console.log("file got");
    updates.profilePicture = req.file.path;
  }

  try {
    const user = await Register.findOneAndUpdate({ username }, updates, {
      new: true,
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const phoneRegister = async (req, res) => {
  try {
    const users = await Register.find({}, "phone username profilePicture"); // Querying only for the 'phone' field
    // const phones = users.map(user => user.phone); // Extracting phone numbers from the users array
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching phone numbers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const latestMessage = async (req, res) => {
//   const { user1, user2 } = req.query;

//   try {
//     const latestMessage = await Chat.findOne({
//       $or: [
//         { sender: user1, receiver: user2 },
//         { sender: user2, receiver: user1 },
//       ],
//     })
//       .sort({ timestamp: -1 })
//       .limit(1);

//     res.json({ message: latestMessage ? latestMessage.message : "" });
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching latest message" });
//   }
// };

// when send 1,2,3 messag then delete 2 for evryone then show you delete message then after 3 delete for you then show 1 not you delete message

// const latestMessage = async (req, res) => {
//   const { user1, user2 } = req.query;

//   try {
//     // 1) fetch the absolute latest (regardless of deletion flags)
//     const raw = await Chat.findOne({
//       $or: [
//         { sender: user1, receiver: user2 },
//         { sender: user2, receiver: user1 },
//       ],
//     })
//       .sort({ timestamp: -1 })
//       .lean();

//     if (!raw) {
//       return res.json({ displayMessage: "" });
//     }

//     // 2) if deleted for everyone → placeholder
//     if (raw.deletedForEveryone) {
//       const placeholder =
//         raw.sender === user1
//           ? "You deleted this message"
//           : "This message was deleted";
//       return res.json({ displayMessage: placeholder });
//     }

//     // 3) if they clicked “delete for you” → skip it and show the next­-latest
//     if (Array.isArray(raw.deletedBy) && raw.deletedBy.includes(user1)) {
//       const prev = await Chat.findOne({
//         $or: [
//           { sender: user1, receiver: user2 },
//           { sender: user2, receiver: user1 },
//         ],
//         deletedForEveryone: { $ne: true },
//         deletedBy: { $nin: [user1] },
//       })
//         .sort({ timestamp: -1 })
//         .lean();

//       return res.json({
//         displayMessage: prev ? prev.message : "",
//       });
//     }

//     // 4) otherwise it’s the normal latest
//     return res.json({ displayMessage: raw.message });
//   } catch (error) {
//     console.error("Error fetching latest message:", error);
//     res.status(500).json({ error: "Error fetching latest message" });
//   }
// };

const latestMessage = async (req, res) => {
  const { user1, user2 } = req.query;

  try {
    // 1) fetch the absolute-latest chat doc
    const raw = await Chat.findOne({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    })
      .sort({ timestamp: -1 })
      .lean();

    if (!raw) {
      // no chats yet
      return res.json({ displayMessage: "" });
    }

    // 2) if deleted for everyone, show the everyone-deleted placeholder
    if (raw.deletedForEveryone) {
      const placeholder =
        raw.sender === user1
          ? "You deleted this message"
          : "This message was deleted";
      return res.json({ displayMessage: placeholder });
    }

    // 3) if this user clicked "delete for you" on the latest, show the you-deleted placeholder
    if (Array.isArray(raw.deletedBy) && raw.deletedBy.includes(user1)) {
      const placeholder =
        raw.sender === user1
          ? "You deleted this message"
          : "This message was deleted";
      return res.json({ displayMessage: placeholder });
    }

    // 4) otherwise nothing was deleted, so show the real text
    return res.json({ displayMessage: raw.message });
  } catch (error) {
    console.error("Error fetching latest message:", error);
    res.status(500).json({ error: "Error fetching latest message" });
  }
};

// ---------------------------------------------
// const registerUser = async (req, res) => {
//   const { username } = req.query;

//   try {
//     // Find the user by username
//     const user = await User.findOne({ username });

//     // If user is not found, return an error
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Find the latest message by username
//     const latestMessage = await Chat.findOne({ username }).sort({ createdAt: -1 });

//     // Return the user details and the latest message
//     res.json({
//       user,
//       latestMessage: latestMessage ? latestMessage.message : ""
//     });
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching user details or latest message' });
//   }
// };

const registerUser = async (req, res) => {
  const { username } = req.query;

  try {
    const user = await Register.findOne({ phone: username }).select(
      "-password"
    );

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Error fetching latest message" });
  }
};

const login = async (req, res) => {
  try {
    const { username, phone, password } = req.body;
    const user = await Register.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, phone: user.phone }, "secretkey", {
      expiresIn: "1d",
    });

    // const newLogin = new Login({
    //   username,
    //   // password: user.password, // Note: Storing passwords in the login schema is not recommended for security reasons.
    //   ipAddress: req.ip,
    // });

    // await newLogin.save();

    res.json({
      message: "Login successful",
      token,
      user: { username: user.username, phone: user.phone },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// app.post('/api/upload-profile-picture', verifyToken, upload.single('profilePicture'), async (req, res) => {
//     const userId = req.userId;
//     const profilePicturePath = req.file ? `/uploads/${req.file.filename}` : null;

//     try {
//         const user = await User.findByIdAndUpdate(userId, { profilePicture: profilePicturePath }, { new: true });
//         res.json(user);
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to upload profile picture', error });
//     }
// });

// app.get('/api/user-profile', verifyToken, async (req, res) => {
//     try {
//         const user = await User.findById(req.userId);
//         res.json(user);
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to fetch user profile', error });
//     }
// });

// const chats = async (req, res) => {
//     const chats = await Chat.find().populate('group');
//     res.json(chats);
// };

// app.post('/api/chats', upload.single('image'), async (req, res) => {
//     const chat = new Chat({
//         message: req.body.message,
//         image: req.file ? `/uploads/${req.file.filename}` : null,
//         sender: req.body.sender,
//         receiver: req.body.receiver,
//         group: req.body.group,
//     });
//     await chat.save();
//     res.json(chat);
// });

// const chatsDelete = async (req, res) => {
//     const { id } = req.params;
//     const { user, deleteForBoth } = req.body;

//     if (deleteForBoth) {
//         await Chat.findByIdAndDelete(id);
//     } else {
//         await Chat.findByIdAndUpdate(id, { $push: { deletedBy: user } });
//     }

//     res.json({ message: 'Chat deleted' });
// };

// const chats = async (req, res) => {
//   try {
//     const { message, sender, receiver, image } = req.body;
//     console.log("Request body:", req.body);

//     if (!sender || !receiver) {
//       console.log("Sender or receiver missing");
//       return res
//         .status(400)
//         .json({ message: "Sender and receiver are required" });
//     }

//     // Check if the sender is blocked by the receiver
//     const ownerContacts = await Contact.findOne({ owner: receiver });

//     if (ownerContacts) {
//       const blockedByReceiver = ownerContacts.contacts.find(
//         (contact) => contact.contactPhone === sender && contact.isBlocked
//       );
//       if (blockedByReceiver) {
//         return res.status(403).json({ message: "You are blocked by this user." });
//       }
//     }

//     // Check if the receiver is blocked by the sender
//     const senderContacts = await Contact.findOne({ owner: sender });

//     if (senderContacts) {
//       const blockedBySender = senderContacts.contacts.find(
//         (contact) => contact.contactPhone === receiver && contact.isBlocked
//       );
//       if (blockedBySender) {
//         return res.status(403).json({ message: "You have blocked this user." });
//       }
//     }

//     // Save the message if no block is detected
//     const chat = new Chat({
//       message,
//       sender,
//       receiver,
//       image: req.file ? req.file.path : null,
//     }); // Save file path to image field
//     await chat.save();
//     console.log("Chat saved:", chat);

//     req.io.emit("receiveMessage", chat);
//     res.json(chat);
//   } catch (error) {
//     console.error("Error saving chat:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// not show top user new message

// const chats = async (req, res) => {
//   try {
//     const { message, sender, receiver, image } = req.body;

//     if (!sender || !receiver) {
//       return res
//         .status(400)
//         .json({ message: "Sender and receiver are required" });
//     }

//     // Save the message first (always save the message to the database)
//     const chat = new Chat({
//       message,
//       sender,
//       receiver,
//       image: req.file ? req.file.path : null,
//       status: "sent", // default status to "sent"
//     });

//     await chat.save();
//     console.log("Chat saved:", chat);

//     // Fetch the receiver's contact list to check if the sender is blocked
//     const receiverContact = await Contact.findOne({ owner: receiver });

//     let isBlocked = false;

//     if (receiverContact) {
//       // Check if the receiver has blocked the sender in contacts
//       isBlocked = receiverContact.contacts.some(
//         (contact) => contact.contactPhone === sender && contact.isBlocked
//       );

//       // If not blocked in contacts, check if the sender is blocked in unknownContacts
//       if (!isBlocked) {
//         isBlocked = receiverContact.unknownContacts.some(
//           (contact) => contact.contactPhone === sender && contact.isBlocked
//         );
//       }
//     }

//     // If the receiver has blocked the sender, don't emit the message
//     if (isBlocked) {
//       console.log(
//         `Message saved, but not delivered. Receiver (${receiver}) has blocked sender (${sender})`
//       );
//       return res
//         .status(200)
//         .json({ message: "Message saved but blocked by receiver." });
//     }

//     // If not blocked, update the message status to "delivered" and emit to receiver
//     chat.status = "sent";
//     await chat.save(); // Save the updated status

//     // Emit the message to the receiver if not blocked
//     req.io.emit("receiveMessage", chat);

//     res.json(chat); // Send back the saved chat object as response
//   } catch (error) {
//     console.error("Error saving chat:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// same helper, pulled out so it’s available here
// async function reorderContacts(ownerPhone, contactPhone) {
//   const doc = await Contact.findOne({ owner: ownerPhone });
//   if (!doc) return;
//   let subdoc = doc.contacts.find((c) => c.contactPhone === contactPhone);
//   let field = "contacts";
//   if (!subdoc) {
//     subdoc = doc.unknownContacts.find((c) => c.contactPhone === contactPhone);
//     field = "unknownContacts";
//   }
//   if (!subdoc) return;
//   await Contact.updateOne(
//     { owner: ownerPhone },
//     {
//       $pull: { [field]: { contactPhone } },
//       $push: { [field]: { $each: [subdoc], $position: 0 } },
//     }
//   );
// }

async function reorderContacts(ownerPhone, contactPhone) {
  const doc = await Contact.findOne({ owner: ownerPhone });
  if (!doc) return;

  let subdoc = doc.contacts.find((c) => c.contactPhone === contactPhone);
  let field = "contacts";

  if (!subdoc) {
    subdoc = doc.unknownContacts.find((c) => c.contactPhone === contactPhone);
    field = "unknownContacts";
  }

  if (!subdoc) return;

  // Clone the subdoc and remove _id to avoid duplicate key error
  const reorderedContact = { ...subdoc.toObject() };
  delete reorderedContact._id;

  await Contact.updateOne(
    { owner: ownerPhone },
    {
      $pull: { [field]: { contactPhone } },
    }
  );

  await Contact.updateOne(
    { owner: ownerPhone },
    {
      $push: {
        [field]: { $each: [reorderedContact], $position: 0 },
      },
    }
  );
}

const chats = async (req, res) => {
  try {
    const { message, sender, receiver, image } = req.body;

    if (!sender || !receiver) {
      return res
        .status(400)
        .json({ message: "Sender and receiver are required" });
    }

    // Save the message first (always save the message to the database)
    const chat = new Chat({
      message,
      sender,
      receiver,
      image: req.file ? req.file.path : null,
      status: "sent", // default status to "sent"
    });

    await chat.save();
    console.log("Chat saved:", chat);

    // Fetch the receiver's contact list to check if the sender is blocked
    const receiverContact = await Contact.findOne({ owner: receiver });

    let isBlocked = false;

    if (receiverContact) {
      // Check if the receiver has blocked the sender in contacts
      isBlocked = receiverContact.contacts.some(
        (contact) => contact.contactPhone === sender && contact.isBlocked
      );

      // If not blocked in contacts, check if the sender is blocked in unknownContacts
      if (!isBlocked) {
        isBlocked = receiverContact.unknownContacts.some(
          (contact) => contact.contactPhone === sender && contact.isBlocked
        );
      }
    }

    // If the receiver has blocked the sender, don't emit the message
    if (isBlocked) {
      console.log(
        `Message saved, but not delivered. Receiver (${receiver}) has blocked sender (${sender})`
      );
      return res
        .status(200)
        .json({ message: "Message saved but blocked by receiver." });
    }

    // If not blocked, update the message status to "delivered" and emit to receiver
    chat.status = "sent";
    await chat.save(); // Save the updated status

    // reorder for both participants
    await reorderContacts(sender, receiver);
    await reorderContacts(receiver, sender);

    // Emit the message to the receiver if not blocked
    req.io.emit("receiveMessage", chat);

    res.json(chat); // Send back the saved chat object as response
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const editChats = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const chat = await Chat.findById(id);

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const now = Date.now();
    const sentTime = new Date(chat.timestamp).getTime();
    if (now - sentTime > 30 * 60 * 1000) {
      return res.status(403).json({ message: "Edit window expired" });
    }

    chat.message = message;
    chat.edited = true;
    await chat.save();
    req.io.emit("messageEdited", chat);
    res.json(chat);
  } catch (error) {
    console.error("Edit error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const chatsDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, deleteForBoth } = req.body;

    if (deleteForBoth) {
      await Chat.findByIdAndUpdate(id, {
        $set: { deletedForEveryone: true },
      });
    } else {
      await Chat.findByIdAndUpdate(id, {
        $addToSet: { deletedBy: user },
      });
    }

    req.io.emit("messageDeleted", { id, user, deleteForBoth });
    res.json({ message: "Chat deleted" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const chatsDelete = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { user, deleteForBoth } = req.body;

//     if (deleteForBoth) {
//       await Chat.findByIdAndDelete(id);
//     } else {
//       await Chat.findByIdAndUpdate(
//         id,
//         { $addToSet: { deletedBy: user } },
//         { new: true }
//       );
//     }

//     req.io.emit("messageDeleted", { id, user, deleteForBoth });
//     res.json({ message: "Chat deleted" });
//   } catch (error) {
//     console.error("Error deleting chat:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const getChats = async (req, res) => {
  try {
    console.log("req.user:", req.user); // Debugging log
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { phone } = req.user;
    const chats = await Chat.find({
      $or: [{ sender: phone }, { receiver: phone }],
    })
      .populate("sender", "username")
      .populate("receiver", "username");

    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const paymentAdd = async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Twilio Config
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE;
const client = twilio(accountSid, authToken);

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Ensure phone number starts with +91
    // if (!phone.startsWith("+91")) {
    //   phone = `+91${phone}`;
    // }
    const user = await Register.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate OTP
    // const otp = otpGenerator.generate(6, {
    //   upperCase: false,
    //   specialChars: false,
    // });
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiration
    await user.save();

    // Send OTP via Twilio SMS
    await client.messages.create({
      body: `Your OTP for login is: ${otp}. It is valid for 5 minutes.`,
      from: twilioPhone,
      to: `+91${phone}`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await Register.findOne({ phone });
    console.log(user, phone, otp);

    if (!user || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP after verification

    // user.otp = null;
    // user.otpExpires = null;
    await user.save();

    // Generate JWT Token
    const token = jwt.sign({ id: user._id, phone: user.phone }, "secretkey", {
      expiresIn: "10d",
    });
    console.log(token);
    res.json({
      message: "Login successful",
      token,
      user: { username: user.username, phone: user.phone },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

// const addContact = async (req, res) => {
//   try {
//     const { owner, contactPhone } = req.body;
//     console.log(owner,contactPhone)
//     // Verify that the phone number exists in the Register collection
//     const registeredUser = await Register.findOne({ phone: contactPhone });
//     if (!registeredUser) {
//       return res.status(400).json({ message: "this user can not use deep chat" });
//     }
//     // Get the contacts list document for the owner (create if not exists)
//     let ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       ownerContacts = new Contact({ owner, contacts: [] });
//     }
//     // Avoid adding duplicate numbers
//     if (ownerContacts.contacts.includes(contactPhone)) {
//       return res.status(400).json({ message: "Contact already added" });
//     }
//     ownerContacts.contacts.push(contactPhone);
//     await ownerContacts.save();
//     res.status(200).json({ message: "Contact added successfully", contacts: ownerContacts.contacts });
//   } catch (error) {
//     console.error("Error adding contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// const addContact = async (req, res) => {
//   try {
//     // Expecting owner, contactPhone, and contactUsername in the request body
//     const { owner, contactPhone, contactUsername } = req.body;
//     console.log(owner, contactPhone, contactUsername);

//     // Verify that the contact phone exists in the Register collection
//     const registeredUser = await Register.findOne({ phone: contactPhone });
//     if (!registeredUser) {
//       return res
//         .status(400)
//         .json({ message: "this user can not use deep chat" });
//     }

//     // Get the contacts list document for the owner (create if not exists)
//     let ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       ownerContacts = new Contact({ owner, contacts: [] });
//     }

//     // Avoid adding duplicate contact phone numbers
//     if (
//       ownerContacts.contacts.some(
//         (contact) => contact.contactPhone === contactPhone
//       )
//     ) {
//       return res.status(400).json({ message: "Contact already added" });
//     }

//     // Avoid adding duplicate usernames among the contacts
//     if (
//       ownerContacts.contacts.some(
//         (contact) => contact.contactUsername === contactUsername
//       )
//     ) {
//       return res.status(400).json({ message: "This username already exists" });
//     }

//     // Push an object with both the contact username and phone
//     ownerContacts.contacts.push({ contactUsername, contactPhone });
//     await ownerContacts.save();
//     res
//       .status(200)
//       .json({
//         message: "Contact added successfully",
//         contacts: ownerContacts.contacts,
//       });
//   } catch (error) {
//     console.error("Error adding contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

//ad  contact alphabetic

// const addContact = async (req, res) => {
//   try {
//     // Expecting owner, contactPhone, and contactUsername in the request body
//     const { owner, contactPhone, contactUsername } = req.body;
//     console.log(owner, contactPhone, contactUsername);

//     // Verify that the contact phone exists in the Register collection
//     // (Assuming that Register is defined or imported elsewhere in your code)
//     const registeredUser = await Register.findOne({ phone: contactPhone });
//     if (!registeredUser) {
//       return res
//         .status(400)
//         .json({ message: "this user can not use deep chat" });
//     }

//     // Get the contacts list document for the owner (create if not exists)
//     let ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       ownerContacts = new Contact({ owner, contacts: [], unknownContacts: [] });
//     }

//     // Avoid adding duplicate contact phone numbers in saved contacts
//     if (
//       ownerContacts.contacts.some(
//         (contact) => contact.contactPhone === contactPhone
//       )
//     ) {
//       return res.status(400).json({ message: "Contact already added" });
//     }

//     // Avoid adding duplicate usernames among the contacts
//     if (
//       ownerContacts.contacts.some(
//         (contact) => contact.contactUsername === contactUsername
//       )
//     ) {
//       return res.status(400).json({ message: "This username already exists" });
//     }

//     // NEW: Remove the number from the unknownContacts list if it exists,
//     // so that when a user decides to save an unknown number, it is migrated.
//     ownerContacts.unknownContacts = ownerContacts.unknownContacts.filter(
//       (contact) => contact.contactPhone !== contactPhone
//     );

//     // Push an object with both the contact username and phone to saved contacts.
//     ownerContacts.contacts.push({ contactUsername, contactPhone });
//     // Sort the contacts array alphabetically by contactUsername (A to Z)
//     // ownerContacts.contacts.sort((a, b) =>
//     //   a.contactUsername
//     //     .toLowerCase()
//     //     .localeCompare(b.contactUsername.toLowerCase())
//     // );
//     ownerContacts.contacts?.sort((a, b) => {
//       const nameA = a?.contactUsername?.toLowerCase() || "";
//       const nameB = b?.contactUsername?.toLowerCase() || "";
//       return nameA.localeCompare(nameB);
//     });
//     await ownerContacts.save();
//     res.status(200).json({
//       message: "Contact added successfully",
//       contacts: ownerContacts.contacts,
//     });
//   } catch (error) {
//     console.error("Error adding contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const addContact = async (req, res) => {
  try {
    const { owner, contactPhone, contactUsername } = req.body;

    if (!owner || !contactPhone || !contactUsername) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedPhone = contactPhone.trim();
    const normalizedUsername = contactUsername.trim();

    // Check if the user exists in the Register collection
    const registeredUser = await Register.findOne({ phone: normalizedPhone });
    if (!registeredUser) {
      return res
        .status(400)
        .json({ message: "This user cannot use Deep Chat" });
    }

    // Find or create owner's contact list
    let ownerContacts = await Contact.findOne({ owner });
    if (!ownerContacts) {
      ownerContacts = new Contact({ owner, contacts: [], unknownContacts: [] });
    }

    // Check for duplicate phone or username
    const phoneExists = ownerContacts.contacts.some(
      (contact) => contact.contactPhone === normalizedPhone
    );

    const usernameExists = ownerContacts.contacts.some(
      (contact) => contact.contactUsername === normalizedUsername
    );

    if (phoneExists) {
      return res.status(400).json({ message: "Contact already added" });
    }

    if (usernameExists) {
      return res.status(400).json({ message: "This username already exists" });
    }

    // Remove from unknownContacts if present
    ownerContacts.unknownContacts = ownerContacts.unknownContacts.filter(
      (contact) => contact.contactPhone !== normalizedPhone
    );

    // Add new contact
    ownerContacts.contacts.push({
      contactUsername: normalizedUsername,
      contactPhone: normalizedPhone,
    });

    // Sort contacts alphabetically by username
    ownerContacts.contacts.sort((a, b) => {
      const nameA = a?.contactUsername?.toLowerCase() || "";
      const nameB = b?.contactUsername?.toLowerCase() || "";
      return nameA.localeCompare(nameB);
    });

    await ownerContacts.save();

    res.status(200).json({
      message: "Contact added successfully",
      contacts: ownerContacts.contacts,
    });
  } catch (error) {
    console.error("Error adding contact:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Remove a contact from the saved contacts list
// const removeContact = async (req, res) => {
//   try {
//     const { owner, contactPhone } = req.body;
//     const ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       return res.status(400).json({ message: "No contact list found" });
//     }
//     ownerContacts.contacts = ownerContacts.contacts.filter(
//       (contact) => contact.contactPhone !== contactPhone
//     );
//     await ownerContacts.save();
//     res.status(200).json({
//       message: "Contact removed successfully",
//       contacts: ownerContacts.contacts,
//     });
//   } catch (error) {
//     console.error("Error removing contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const removeContact = async (req, res) => {
  try {
    const { owner, contactPhone } = req.body;

    if (!owner || !contactPhone) {
      return res
        .status(400)
        .json({ message: "'owner' and 'contactPhone' are required" });
    }

    const ownerContacts = await Contact.findOne({ owner });
    if (!ownerContacts) {
      return res.status(400).json({ message: "No contact list found" });
    }

    const initialLength = ownerContacts.contacts.length;

    ownerContacts.contacts = ownerContacts.contacts.filter(
      (contact) => contact.contactPhone !== contactPhone
    );

    if (ownerContacts.contacts.length === initialLength) {
      return res.status(404).json({ message: "Contact not found" });
    }

    await ownerContacts.save();

    res.status(200).json({
      message: "Contact removed successfully",
      contacts: ownerContacts.contacts,
    });
  } catch (error) {
    console.error("Error removing contact:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get the contact lists for the user – both saved and unknown contacts

// not show top new msg recive

// const getContacts = async (req, res) => {
//   try {
//     const { owner } = req.query;
//     const ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       // Return both arrays empty if no document exists
//       return res.status(200).json({ contacts: [], unknownContacts: [] });
//     }
//     res.status(200).json({
//       contacts: ownerContacts.contacts,
//       unknownContacts: ownerContacts.unknownContacts,
//     });
//   } catch (error) {
//     console.error("Error fetching contacts:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const getContacts = async (req, res) => {
  try {
    const owner = req.query.owner;
    const doc = await Contact.findOne({ owner });
    if (!doc) return res.status(404).json({ message: "No contacts found" });
    // contacts and unknownContacts are already in the correct, persisted order
    res.json({
      contacts: doc.contacts,
      unknownContacts: doc.unknownContacts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// const getContacts = async (req, res) => {
//   try {
//     const { owner } = req.query;

//     if (!owner) {
//       return res.status(400).json({ message: "Owner is required in query parameters" });
//     }

//     const ownerContacts = await Contact.findOne({ owner });

//     if (!ownerContacts) {
//       return res.status(200).json({
//         contacts: [],
//         unknownContacts: [],
//         blockContacts: [],
//         blockUnknownContacts: []
//       });
//     }

//     res.status(200).json({
//       contacts: ownerContacts.contacts || [],
//       unknownContacts: ownerContacts.unknownContacts || [],
//       blockContacts: ownerContacts.blockContacts || [],
//       blockUnknownContacts: ownerContacts.blockUnknownContacts || []
//     });
//   } catch (error) {
//     console.error("Error fetching contacts:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// const getContacts = async (req, res) => {
//   try {
//     const { owner } = req.body; // This should be the current user's number or ID

//     // Get all users except the current one (optional; remove filter if not needed)
//     const users = await User.find({ owner: { $ne: owner } });

//     res.status(200).json({ success: true, users });
//   } catch (err) {
//     console.error("Error fetching users:", err);
//     res.status(500).json({ success: false, message: "Server error while fetching users." });
//   }
// };

// const updateContact = async (req, res) => {
//   try {
//     // Expecting owner, oldContactPhone, newContactPhone, and newContactUsername in req.body
//     const { owner, oldContactPhone, newContactPhone, newContactUsername } =
//       req.body;
//     console.log(owner, oldContactPhone, newContactPhone, newContactUsername);

//     // Verify that the new contact phone exists in the Register collection
//     const registeredUser = await Register.findOne({ phone: newContactPhone });
//     if (!registeredUser) {
//       return res
//         .status(400)
//         .json({ message: "this user can not use deep chat" });
//     }

//     // Get the owner's contacts document
//     let ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       return res.status(400).json({ message: "No contact list found" });
//     }

//     // Check if the new username already exists in the list (for a different contact)
//     if (
//       ownerContacts.contacts.some(
//         (contact) =>
//           contact.contactUsername === newContactUsername &&
//           contact.contactPhone !== oldContactPhone
//       )
//     ) {
//       return res.status(400).json({ message: "This username already exists" });
//     }

//     // Find the contact to be updated by matching the old contact phone
//     const contactIndex = ownerContacts.contacts.findIndex(
//       (contact) => contact.contactPhone === oldContactPhone
//     );
//     if (contactIndex === -1) {
//       return res.status(400).json({ message: "Contact not found" });
//     }

//     // Update the contact with the new details
//     ownerContacts.contacts[contactIndex] = {
//       contactUsername: newContactUsername,
//       contactPhone: newContactPhone,
//     };

//     await ownerContacts.save();
//     res
//       .status(200)
//       .json({
//         message: "Contact updated successfully",
//         contacts: ownerContacts.contacts,
//       });
//   } catch (error) {
//     console.error("Error updating contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// Update a saved contact (by replacing the details for a given contact phone)
// const updateContact = async (req, res) => {
//   try {
//     // Expecting owner, oldContactPhone, newContactPhone, and newContactUsername in req.body
//     const { owner, oldContactPhone, newContactPhone, newContactUsername } =
//       req.body;
//     console.log(owner, oldContactPhone, newContactPhone, newContactUsername);

//     // Verify that the new contact phone exists in the Register collection
//     const registeredUser = await Register.findOne({ phone: newContactPhone });
//     if (!registeredUser) {
//       return res
//         .status(400)
//         .json({ message: "this user can not use deep chat" });
//     }

//     // Get the owner's contacts document
//     let ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       return res.status(400).json({ message: "No contact list found" });
//     }

//     // Check if the new username already exists in the saved contacts for a different number.
//     if (
//       ownerContacts.contacts.some(
//         (contact) =>
//           contact.contactUsername === newContactUsername &&
//           contact.contactPhone !== oldContactPhone
//       )
//     ) {
//       return res.status(400).json({ message: "This username already exists" });
//     }

//     // Find the contact to be updated by matching the old contact phone
//     const contactIndex = ownerContacts.contacts.findIndex(
//       (contact) => contact.contactPhone === oldContactPhone
//     );
//     if (contactIndex === -1) {
//       return res.status(400).json({ message: "Contact not found" });
//     }

//     // Update the contact with the new details
//     ownerContacts.contacts[contactIndex] = {
//       contactUsername: newContactUsername,
//       contactPhone: newContactPhone,
//     };

//     // Sort the contacts array alphabetically by contactUsername (A to Z)
//     // ownerContacts.contacts.sort((a, b) =>
//     //   a.contactUsername
//     //     .toLowerCase()
//     //     .localeCompare(b.contactUsername.toLowerCase())
//     // );
//     ownerContacts.contacts = ownerContacts.contacts
//       ?.filter((c) => c.contactUsername)
//       .sort((a, b) =>
//         a.contactUsername
//           .toLowerCase()
//           .localeCompare(b.contactUsername.toLowerCase())
//       );

//     await ownerContacts.save();
//     res.status(200).json({
//       message: "Contact updated successfully",
//       contacts: ownerContacts.contacts,
//     });
//   } catch (error) {
//     console.error("Error updating contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const updateContact = async (req, res) => {
  try {
    const { owner, oldContactPhone, newContactPhone, newContactUsername } =
      req.body;

    if (!owner || !oldContactPhone || !newContactPhone || !newContactUsername) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedOldPhone = oldContactPhone.trim();
    const normalizedNewPhone = newContactPhone.trim();
    const normalizedUsername = newContactUsername.trim();

    const registeredUser = await Register.findOne({
      phone: normalizedNewPhone,
    });
    if (!registeredUser) {
      return res
        .status(400)
        .json({ message: "This user cannot use Deep Chat" });
    }

    let ownerContacts = await Contact.findOne({ owner });
    if (!ownerContacts) {
      return res.status(400).json({ message: "No contact list found" });
    }

    // Check if username already exists with a different phone
    const duplicateUsername = ownerContacts.contacts.some(
      (contact) =>
        contact.contactUsername === normalizedUsername &&
        contact.contactPhone !== normalizedOldPhone
    );

    if (duplicateUsername) {
      return res.status(400).json({ message: "This username already exists" });
    }

    const contactIndex = ownerContacts.contacts.findIndex(
      (contact) => contact.contactPhone === normalizedOldPhone
    );

    if (contactIndex === -1) {
      return res.status(400).json({ message: "Contact not found" });
    }

    // Update contact details
    ownerContacts.contacts[contactIndex] = {
      contactUsername: normalizedUsername,
      contactPhone: normalizedNewPhone,
    };

    // Sort contacts by username
    ownerContacts.contacts = ownerContacts.contacts
      ?.filter((c) => c.contactUsername)
      .sort((a, b) => {
        const nameA = a?.contactUsername?.toLowerCase() || "";
        const nameB = b?.contactUsername?.toLowerCase() || "";
        return nameA.localeCompare(nameB);
      });

    await ownerContacts.save();

    res.status(200).json({
      message: "Contact updated successfully",
      contacts: ownerContacts.contacts,
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// NEW FUNCTIONALITY: When a message is received from an unknown number,
// add the number (with a provided contactUsername) to the unknownContacts array.
// const addUnknownContact = async (req, res) => {
//   try {
//     // Expecting owner, contactPhone, and contactUsername in the request body.
//     // This endpoint should be triggered when a message is received from an unsaved (unknown) number.
//     const { owner, contactPhone, contactUsername } = req.body;
//     let ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       ownerContacts = new Contact({ owner, contacts: [], unknownContacts: [] });
//     }
//     // Check if the number already exists in either saved contacts or unknown contacts.
//     const existsInContacts = ownerContacts.contacts.some(
//       (contact) => contact.contactPhone === contactPhone
//     );
//     const existsInUnknowns = ownerContacts.unknownContacts.some(
//       (contact) => contact.contactPhone === contactPhone
//     );
//     if (existsInContacts || existsInUnknowns) {
//       return res.status(400).json({ message: "Contact already exists" });
//     }
//     // Add the unknown contact
//     ownerContacts.unknownContacts.push({ contactUsername, contactPhone });
//     // Sort alphabetically by the contactUsername field
//     // ownerContacts.unknownContacts?.sort((a, b) =>
//     //   a?.contactUsername?.toLowerCase()?.localeCompare(b?.contactUsername?.toLowerCase())
//     // );
//     ownerContacts.unknownContacts?.sort((a, b) => {
//       const nameA = a?.contactUsername?.toLowerCase() || "";
//       const nameB = b?.contactUsername?.toLowerCase() || "";
//       return nameA.localeCompare(nameB);
//     });
//     await ownerContacts.save();
//     res.status(200).json({
//       message: "Unknown contact added successfully",
//       unknownContacts: ownerContacts.unknownContacts,
//     });
//   } catch (error) {
//     console.error("Error adding unknown contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const addUnknownContact = async (req, res) => {
  try {
    const { owner, contactPhone, contactUsername } = req.body;

    if (!owner || !contactPhone || !contactUsername) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedPhone = contactPhone.trim();
    const normalizedUsername = contactUsername.trim();

    let ownerContacts = await Contact.findOne({ owner });
    if (!ownerContacts) {
      ownerContacts = new Contact({ owner, contacts: [], unknownContacts: [] });
    }

    const existsInContacts = ownerContacts.contacts.some(
      (contact) => contact.contactPhone.trim() === normalizedPhone
    );
    const existsInUnknowns = ownerContacts.unknownContacts.some(
      (contact) => contact.contactPhone.trim() === normalizedPhone
    );

    if (existsInContacts || existsInUnknowns) {
      return res.status(200).json({
        message: "Unknown contact already exists",
        unknownContacts: ownerContacts.unknownContacts,
      });
    }

    ownerContacts.unknownContacts.push({
      contactUsername: normalizedUsername,
      contactPhone: normalizedPhone,
    });

    ownerContacts.unknownContacts.sort((a, b) => {
      const nameA = a?.contactUsername?.toLowerCase() || "";
      const nameB = b?.contactUsername?.toLowerCase() || "";
      return nameA.localeCompare(nameB);
    });

    await ownerContacts.save();

    res.status(200).json({
      message: "Unknown contact added successfully",
      unknownContacts: ownerContacts.unknownContacts,
    });
  } catch (error) {
    console.error("Error adding unknown contact:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// NEW FUNCTIONALITY: Remove an unknown contact from the unknownContacts array.
// This may be used if the user later decides to save an unknown number.
// const removeUnknownContact = async (req, res) => {
//   try {
//     const { owner, contactPhone } = req.body;
//     let ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       return res.status(400).json({ message: "No contact list found" });
//     }
//     ownerContacts.unknownContacts = ownerContacts.unknownContacts.filter(
//       (contact) => contact.contactPhone !== contactPhone
//     );
//     await ownerContacts.save();
//     res.status(200).json({
//       message: "Unknown contact removed successfully",
//       unknownContacts: ownerContacts.unknownContacts,
//     });
//   } catch (error) {
//     console.error("Error removing unknown contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const removeUnknownContact = async (req, res) => {
  try {
    const { owner, contactPhone } = req.body;

    if (!owner || !contactPhone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedPhone = contactPhone.trim();

    const ownerContacts = await Contact.findOne({ owner });
    if (!ownerContacts) {
      return res.status(400).json({ message: "No contact list found" });
    }

    const contactExists = ownerContacts.unknownContacts.some(
      (contact) => contact.contactPhone === normalizedPhone
    );

    if (!contactExists) {
      return res.status(404).json({ message: "Unknown contact not found" });
    }

    ownerContacts.unknownContacts = ownerContacts.unknownContacts.filter(
      (contact) => contact.contactPhone !== normalizedPhone
    );

    await ownerContacts.save();

    res.status(200).json({
      message: "Unknown contact removed successfully",
      unknownContacts: ownerContacts.unknownContacts,
    });
  } catch (error) {
    console.error("Error removing unknown contact:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const blockContact = async (req, res) => {
//   try {
//     const { owner, contactPhone } = req.body;

//     // Find the contact list document for the owner
//     let ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       return res.status(400).json({ message: "No contact list found" });
//     }

//     // Find the index of the contact to be blocked
//     const contactIndex = ownerContacts.contacts.findIndex(
//       (contact) => contact.contactPhone === contactPhone
//     );
//     if (contactIndex === -1) {
//       return res
//         .status(400)
//         .json({ message: "Contact not found in saved contacts" });
//     }

//     // Get the contact data and move it to the block list
//     const contactData = ownerContacts.contacts[contactIndex];
//     ownerContacts.contacts.splice(contactIndex, 1); // Remove from saved contacts
//     ownerContacts.blockContacts.push(contactData); // Add to blocked contacts

//     // Save the updated contact list
//     await ownerContacts.save();

//     // Respond with updated contact lists
//     res.status(200).json({
//       message: "Contact blocked successfully",
//       contacts: ownerContacts.contacts, // Remaining contacts
//       blockContacts: ownerContacts.blockContacts, // Blocked contacts
//     });
//   } catch (error) {
//     console.error("Error blocking contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// const unblockContact = async (req, res) => {
//   try {
//     const { owner, contactPhone } = req.body;

//     // Find the owner contacts document
//     let ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       return res.status(400).json({ message: "No contact list found" });
//     }

//     // Find the index of the blocked contact
//     const blockedIndex = ownerContacts.blockContacts.findIndex(
//       (contact) => contact.contactPhone === contactPhone
//     );
//     if (blockedIndex === -1) {
//       return res
//         .status(400)
//         .json({ message: "Contact not found in blocked contacts" });
//     }

//     // Get the blocked contact data and move it to saved contacts
//     const contactData = ownerContacts.blockContacts[blockedIndex];
//     ownerContacts.blockContacts.splice(blockedIndex, 1); // Remove from block list
//     ownerContacts.contacts.push(contactData); // Add to saved contacts

//     // Sort contacts alphabetically after unblocking
//     ownerContacts.contacts.sort((a, b) =>
//       a.contactUsername
//         .toLowerCase()
//         .localeCompare(b.contactUsername.toLowerCase())
//     );

//     // Save the updated contacts list
//     await ownerContacts.save();

//     // Respond with updated lists
//     res.status(200).json({
//       message: "Contact unblocked successfully",
//       contacts: ownerContacts.contacts, // Updated list of saved contacts
//       blockContacts: ownerContacts.blockContacts, // Updated list of blocked contacts
//     });
//   } catch (error) {
//     console.error("Error unblocking contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// const blockunknowncontact = async (req, res) => {
//   try {
//     const { owner, contactPhone } = req.body;

//     // Find the owner's contacts
//     let ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       ownerContacts = new Contact({ owner, contacts: [], unknownContacts: [] });
//     }

//     // Find the index of the unknown contact
//     const unknownIndex = ownerContacts.unknownContacts.findIndex(
//       (contact) => contact.contactPhone === contactPhone
//     );
//     if (unknownIndex === -1) {
//       return res.status(400).json({ message: "Unknown contact not found" });
//     }

//     // Get the unknown contact data and move it to blocked list
//     const unknownData = ownerContacts.unknownContacts[unknownIndex];
//     ownerContacts.unknownContacts.splice(unknownIndex, 1); // Remove from unknown contacts
//     ownerContacts.blockUnknownContacts.push(unknownData); // Add to blocked unknown contacts

//     // Save the updated ownerContacts document
//     await ownerContacts.save();

//     // Respond with the updated contact lists
//     res.status(200).json({
//       message: "Unknown contact blocked successfully",
//       unknownContacts: ownerContacts.unknownContacts,
//       blockUnknownContacts: ownerContacts.blockUnknownContacts,
//     });
//   } catch (error) {
//     console.error("Error blocking unknown contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// const unblockunknowncontact = async (req, res) => {
//   try {
//     const { owner, contactPhone } = req.body;

//     // Find the owner's contact list
//     let ownerContacts = await Contact.findOne({ owner });
//     if (!ownerContacts) {
//       return res.status(400).json({ message: "No contact list found" });
//     }

//     // Find the index of the blocked unknown contact
//     const blockedUnknownIndex = ownerContacts.blockUnknownContacts.findIndex(
//       (contact) => contact.contactPhone === contactPhone
//     );
//     if (blockedUnknownIndex === -1) {
//       return res
//         .status(400)
//         .json({ message: "Blocked unknown contact not found" });
//     }

//     // Get the blocked unknown contact and move it back to unknown contacts
//     const unknownData = ownerContacts.blockUnknownContacts[blockedUnknownIndex];
//     ownerContacts.blockUnknownContacts.splice(blockedUnknownIndex, 1); // Remove from blocked list
//     ownerContacts.unknownContacts.push(unknownData); // Add back to unknown contacts

//     // Optionally, sort the unknown contacts to keep the list ordered
//     ownerContacts.unknownContacts.sort((a, b) =>
//       a.contactUsername
//         .toLowerCase()
//         .localeCompare(b.contactUsername.toLowerCase())
//     );

//     // Save the updated contact list
//     await ownerContacts.save();

//     // Respond with updated lists
//     res.status(200).json({
//       message: "Blocked unknown contact unblocked successfully",
//       unknownContacts: ownerContacts.unknownContacts,
//       blockUnknownContacts: ownerContacts.blockUnknownContacts,
//     });
//   } catch (error) {
//     console.error("Error unblocking unknown contact:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const block = async (req, res) => {
  const { owner, contactPhone } = req.body;
  console.log("Block request body:", req.body); // Debugging log

  try {
    const contact = await Contact.findOne({ owner });
    console.log("Contact found:", contact); // Debugging log

    if (!contact) {
      return res.status(404).send("User not found");
    }

    // Try to find the contact in contacts array first
    let contactToBlock = contact.contacts.find(
      (c) => c.contactPhone === contactPhone
    );

    // If not found in contacts, check in unknownContacts
    if (!contactToBlock) {
      contactToBlock = contact.unknownContacts.find(
        (c) => c.contactPhone === contactPhone
      );
    }

    console.log("Contact to block:", contactToBlock); // Debugging log

    if (contactToBlock) {
      contactToBlock.isBlocked = true; // Mark as blocked

      // Save the contact after blocking it
      await contact.save();
      console.log("Contact saved with isBlocked:", contactToBlock.isBlocked); // Debugging log
      res.status(200).send({ message: "User blocked successfully" });
    } else {
      res.status(404).send("Contact not found");
    }
  } catch (err) {
    console.error("Error saving contact:", err); // Error handling log
    res.status(500).send("Server error");
  }
};

const unblock = async (req, res) => {
  const { owner, contactPhone } = req.body;
  console.log("Unblock request body:", req.body); // Debugging log

  try {
    const contact = await Contact.findOne({ owner });
    console.log("Contact found:", contact); // Debugging log

    if (!contact) {
      return res.status(404).send("User not found");
    }

    // Try to find the contact in contacts array first
    let contactToUnblock = contact.contacts.find(
      (c) => c.contactPhone === contactPhone
    );

    // If not found in contacts, check in unknownContacts
    if (!contactToUnblock) {
      contactToUnblock = contact.unknownContacts.find(
        (c) => c.contactPhone === contactPhone
      );
    }

    console.log("Contact to unblock:", contactToUnblock); // Debugging log

    if (contactToUnblock) {
      contactToUnblock.isBlocked = false; // Mark as unblocked

      // Save the contact after unblocking it
      await contact.save();
      console.log("Contact saved with isBlocked:", contactToUnblock.isBlocked); // Debugging log
      res.status(200).send({ message: "User unblocked successfully" });
    } else {
      res.status(404).send("Contact not found");
    }
  } catch (err) {
    console.error("Error saving contact:", err); // Error handling log
    res.status(500).send("Server error");
  }
};

// const getChats = async (req, res) => {
//   try {
//     const chats = await Chat.find({
//       $or: [
//         { sender: req.params.username },
//         { receiver: req.params.username }
//       ]
//     });
//     res.json(chats);
//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// app.post('/api/groups', async (req, res) => {
//     const group = new Group(req.body);
//     await group.save();
//     res.json(group);
// });

// app.delete('/api/groups/:id', async (req, res) => {
//     const { id } = req.params;
//     await Group.findByIdAndDelete(id);
//     await Chat.deleteMany({ group: id });
//     res.json({ message: 'Group deleted' });
// });

// // Delete message for current user
// app.delete('/api/chats/:id', verifyToken, async (req, res) => {
//     try {
//         const chat = await Chat.findById(req.params.id);
//         if (!chat) {
//             return res.status(404).json({ message: 'Message not found' });
//         }
//         if (chat.sender !== req.userId && chat.receiver !== req.userId) {
//             return res.status(403).json({ message: 'Not authorized' });
//         }
//         if (chat.sender === req.userId) {
//             chat.senderDeleted = true;
//         } else {
//             chat.receiverDeleted = true;
//         }
//         await chat.save();
//         res.json({ message: 'Message deleted for you' });
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to delete message', error });
//     }
// });

// // Delete message for both users
// app.delete('/api/chats/:id/both', verifyToken, async (req, res) => {
//     try {
//         const chat = await Chat.findByIdAndDelete(req.params.id);
//         if (!chat) {
//             return res.status(404).json({ message: 'Message not found' });
//         }
//         res.json({ message: 'Message deleted for both users' });
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to delete message', error });
//     }
// });

// socket.on('deleteMessage', async ({ id, user, deleteForBoth }) => {
//     try {
//         if (deleteForBoth) {
//             const chat = await Chat.findByIdAndDelete(id);
//             if (chat) {
//                 io.to(chat.receiver).emit('messageDeleted', { id });
//                 io.to(chat.sender).emit('messageDeleted', { id });
//             }
//         } else {
//             const chat = await Chat.findById(id);
//             if (chat) {
//                 if (chat.sender === user) {
//                     chat.senderDeleted = true;
//                 } else {
//                     chat.receiverDeleted = true;
//                 }
//                 await chat.save();
//                 io.to(chat.receiver).emit('messageDeleted', { id });
//                 io.to(chat.sender).emit('messageDeleted', { id });
//             }
//         }
//     } catch (error) {
//         console.error('Error deleting message:', error);
//     }
// });

// // server.js

// // Middleware to check if the user is an admin
// function isAdmin(req, res, next) {
//     // Assuming user role is stored in the user object
//     if (req.user && req.user.role === 'admin') {
//         next();
//     } else {
//         res.status(403).json({ message: 'Access denied' });
//     }
// }

// // Fetch all users
// app.get('/api/admin/users', verifyToken, isAdmin, async (req, res) => {
//     try {
//         const users = await User.find().select('-password');
//         res.json(users);
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to fetch users', error });
//     }
// });

// // Fetch all groups
// app.get('/api/admin/groups', verifyToken, isAdmin, async (req, res) => {
//     try {
//         const groups = await Group.find().populate('members', 'username');
//         res.json(groups);
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to fetch groups', error });
//     }
// });

// // Delete a user
// app.delete('/api/admin/users/:id', verifyToken, isAdmin, async (req, res) => {
//     try {
//         await User.findByIdAndDelete(req.params.id);
//         res.json({ message: 'User deleted' });
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to delete user', error });
//     }
// });

// // Delete a group
// app.delete('/api/admin/groups/:id', verifyToken, isAdmin, async (req, res) => {
//     try {
//         await Group.findByIdAndDelete(req.params.id);
//         res.json({ message: 'Group deleted' });
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to delete group', error });
//     }
// });

// routes/auth.js
// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const { check, validationResult } = require('express-validator');
// const Register = require('../model/register-model');
// const router = express.Router();

// const adminMobileNumbers = ['1234567890', '0987654321']; // Example admin mobile numbers

// router.post(
//     '/register',
//     [
//         check('username', 'Username is required').not().isEmpty(),
//         check('password', 'Password is required').not().isEmpty(),
//         check('mobile', 'Mobile number is required').not().isEmpty(),
//     ],
//     async (req, res) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }

//         const { username, password, mobile } = req.body;

//         try {
//             let user = await User.findOne({ mobile });
//             if (user) {
//                 return res.status(400).json({ msg: 'User already exists' });
//             }

//             user = new User({
//                 username,
//                 password,
//                 mobile,
//                 role: adminMobileNumbers.includes(mobile) ? 'admin' : 'user',
//             });

//             const salt = await bcrypt.genSalt(10);
//             user.password = await bcrypt.hash(password, salt);

//             await user.save();

//             const payload = {
//                 user: {
//                     id: user.id,
//                     role: user.role,
//                 },
//             };

//             jwt.sign(
//                 payload,
//                 'secret',
//                 { expiresIn: 360000 },
//                 (err, token) => {
//                     if (err) throw err;
//                     res.json({ token });
//                 }
//             );
//         } catch (err) {
//             console.error(err.message);
//             res.status(500).send('Server error');
//         }
//     }
// );

const trend = async (req, res) => {
  const category = req.params.category.toLowerCase();
  // const redditURL = `https://www.reddit.com/r/${category}/hot.json?limit=20`; // Increased limit to fetch more posts

  try {
    const response = await axios.get(redditURL);
    const posts = response.data.data.children.map((post) => ({
      title: post.data.title,
      // url: `https://www.reddit.com${post.data.permalink}`,
      image:
        post.data.preview?.images?.[0]?.source?.url.replace(/&amp;/g, "&") ||
        null,
      author: post.data.author,
      subreddit: post.data.subreddit,
      created: new Date(post.data.created_utc * 1000).toLocaleString(), // Date posted (formatted)
      description: post.data.selftext
        ? post.data.selftext
        : "No description available", // Post description
      // postLink: `https://www.reddit.com${post.data.permalink}`,  // Link to the post
      credit: `Post by u/${post.data.author} in r/${post.data.subreddit}`, // Credit information
    }));
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Invalid category or Reddit fetch failed" });
  }
};

module.exports = {
  register,
  login,
  chats,
  chatsDelete,
  getChats,
  phoneRegister,
  latestMessage,
  registerUser,
  updateprofile,
  paymentAdd,
  sendOtp,
  verifyOtp,
  addContact,
  removeContact,
  getContacts,
  updateContact,
  addUnknownContact,
  removeUnknownContact,
  // blockContact,
  // unblockContact,
  // blockunknowncontact,
  // unblockunknowncontact,
  block,
  unblock,
  editChats,
  trend,
};
