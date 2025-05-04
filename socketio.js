const { Server } = require("socket.io");
const Chat = require("./model/chat-model");

const users = new Map();
const anonymousChats = {}; // Store anonymous chat rooms

function configureSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });
  
  async function reorderContacts(ownerPhone, contactPhone) {
    const doc = await Contact.findOne({ owner: ownerPhone });
    // console.log(doc);
    console.log("call");
    if (!doc) return;

    let arrayField = "contacts";
    let subdoc = doc.contacts.find((c) => c.contactPhone === contactPhone);

    if (!subdoc) {
      arrayField = "unknownContacts";
      subdoc = doc.unknownContacts.find((c) => c.contactPhone === contactPhone);
    }
    if (!subdoc) return;

    // 1) pull it out
    await Contact.updateOne(
      { owner: ownerPhone },
      { $pull: { [arrayField]: { contactPhone } } }
    );
    // 2) push it to front
    await Contact.updateOne(
      { owner: ownerPhone },
      { $push: { [arrayField]: { $each: [subdoc], $position: 0 } } }
    );
  }

  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("userConnected", (username) => {
      users.set(socket.id, username);
      io.emit("updateUserList", Array.from(users.values()));
    });

    socket.on("sendMessage", async (data) => {
      try {
        const { message, sender, receiver, image } = data;
        console.log("hello");
        console.log(image);

        if (!sender || !receiver) {
          console.error("Sender and receiver are required");
          return;
        }

        const chat = new Chat({ message, sender, receiver, image });
        await chat.save();

        // 2) reorder both sides’ contact lists
        // await reorderContacts(sender, receiver);
        // await reorderContacts(receiver, sender);

        io.emit("receiveMessage", chat);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });
    socket.on("messageReceived", async ({ chatId }) => {
      await Chat.findByIdAndUpdate(chatId, { status: "received" });
      io.emit("messageStatusUpdate", { chatId, status: "received" });
    });

    socket.on("messageSeen", async ({ chatId }) => {
      await Chat.findByIdAndUpdate(chatId, { status: "seen" });
      io.emit("messageStatusUpdate", { chatId, status: "seen" });
    });

    // socket.on("deleteMessage", async ({ id, user, deleteForBoth }) => {
    //   if (deleteForBoth) {
    //     await Chat.findByIdAndDelete(id);
    //   } else {
    //     await Chat.findByIdAndUpdate(
    //       id,
    //       { $addToSet: { deletedBy: user } },
    //       { new: true }
    //     );
    //   }
    //   io.emit("messageDeleted", { id, user, deleteForBoth });
    // });

    socket.on("deleteMessage", async ({ id, user, deleteForBoth }) => {
      if (deleteForBoth) {
        await Chat.findByIdAndDelete(id);
      } else {
        await Chat.findByIdAndUpdate(
          id,
          { $addToSet: { deletedBy: user } },
          { new: true }
        );
      }
      io.emit("messageDeleted", { id, user, deleteForBoth });
    });

    // Create Anonymous Chat
    socket.on("createAnonymousChat", ({ username }) => {
      const chatId = Math.random().toString(36).substring(2, 10);
      const password = Math.random().toString(36).substring(2, 10);

      anonymousChats[chatId] = {
        password,
        users: new Map(), // Store socketId -> username
        messages: [],
        creator: socket.id, // Store the creator's socket ID
      };

      anonymousChats[chatId].users.set(socket.id, username);
      socket.join(chatId);
      socket.emit("chatCreated", { chatId, password });
      io.to(chatId).emit(
        "updateUserList",
        Array.from(anonymousChats[chatId].users.values())
      );
    });

    // Join Anonymous Chat
    socket.on("joinAnonymousChat", ({ chatId, password, username }) => {
      if (
        !anonymousChats[chatId] ||
        anonymousChats[chatId].password !== password
      ) {
        socket.emit("error", "Invalid Chat ID or Password");
        return;
      }

      anonymousChats[chatId].users.set(socket.id, username);
      socket.join(chatId);
      socket.emit("chatHistory", anonymousChats[chatId].messages);
      io.to(chatId).emit(
        "updateUserList",
        Array.from(anonymousChats[chatId].users.values())
      );
    });

    // Send Message
    socket.on("sendAnonymousMessage", ({ chatId, message }) => {
      if (anonymousChats[chatId]) {
        const msg = {
          sender: anonymousChats[chatId].users.get(socket.id),
          text: message,
        };
        anonymousChats[chatId].messages.push(msg);
        io.to(chatId).emit("anonymousMessage", msg);
      }
    });

    // Remove User from Chat (Only Creator Can Remove)
    socket.on("removeUser", ({ chatId, userToRemove }) => {
      if (
        anonymousChats[chatId] &&
        anonymousChats[chatId].creator === socket.id
      ) {
        for (let [socketId, username] of anonymousChats[chatId].users) {
          if (username === userToRemove) {
            io.sockets.sockets.get(socketId)?.leave(chatId);
            anonymousChats[chatId].users.delete(socketId);
            io.to(chatId).emit(
              "updateUserList",
              Array.from(anonymousChats[chatId].users.values())
            );
            io.to(socketId).emit("removedFromChat");
            break;
          }
        }
      }
    });

    socket.on("closeChat", ({ chatId }) => {
      if (anonymousChats[chatId]) {
        io.to(chatId).emit("chatClosed");
        delete anonymousChats[chatId];
      }
    });

    // Handle Disconnect
    socket.on("disconnect", () => {
      for (let chatId in anonymousChats) {
        if (anonymousChats[chatId].users.has(socket.id)) {
          anonymousChats[chatId].users.delete(socket.id);
          io.to(chatId).emit(
            "updateUserList",
            Array.from(anonymousChats[chatId].users.values())
          );
        }
      }
    });
  });

  //   socket.on("disconnect", () => {
  //     users.delete(socket.id);
  //     io.emit("updateUserList", Array.from(users.values()));
  //     console.log("user disconnected");
  //   });
  // });

  return io;
}

module.exports = configureSocket;

// // socketio.js
// const { Server } = require("socket.io");
// const Chat = require("./model/chat-model");
// const createUserSchema = require("./model/user-model");

// const users = new Map();

// function configureSocket(server) {
//   const io = new Server(server, {
//     cors: {
//       origin: "http://localhost:5173",
//       methods: ["GET", "POST"],
//     },
//   });

//   io.on("connection", (socket) => {
//     console.log("a user connected");

//     socket.on("userConnected", (username) => {
//       users.set(socket.id, username);
//       io.emit("updateUserList", Array.from(users.values()));
//     });

//     socket.on("sendMessage", async (data) => {
//       const chat = new Chat(data);
//       await chat.save();
//       io.emit("receiveMessage", chat);
//     });

//     socket.on("sendPersonalMessage", async (data) => {
//       const { to, message, sender } = data;
//       const recipientSocketId = [...users].find(([id, name]) => name === to)?.[0];
//       if (recipientSocketId) {
//         const senderSchema = createUserSchema(sender);
//         const receiverSchema = createUserSchema(to);

//         const personalMessage = { message, sender, receiver: to };

//         await new senderSchema(personalMessage).save();
//         await new receiverSchema(personalMessage).save();

//         io.to(recipientSocketId).emit("receivePersonalMessage", personalMessage);
//       }
//     });

//     socket.on("deleteMessage", async ({ id, user, deleteForBoth }) => {
//       if (deleteForBoth) {
//         await Chat.findByIdAndDelete(id);
//       } else {
//         await Chat.findByIdAndUpdate(id, { $push: { deletedBy: user } });
//       }
//       io.emit("messageDeleted", { id, user, deleteForBoth });
//     });

//     socket.on("disconnect", () => {
//       users.delete(socket.id);
//       io.emit("updateUserList", Array.from(users.values()));
//       console.log("user disconnected");
//     });
//   });

//   return io;
// }

// module.exports = configureSocket;
