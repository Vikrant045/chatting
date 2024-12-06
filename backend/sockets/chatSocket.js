const userSocketMap = {}; // Map to track connected users and their socket IDs
const unreadMessages = {}; // Object to track unread messages
const selectedPartners = {}; // Track mutual selection
const Message = require("../models/Message");

// Helper function to create a unique room ID for two users
const getRoomId = (userA, userB) => {
  return [userA, userB].sort().join("-"); // Sort to ensure a consistent room ID
};

exports.chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Register the user and map their socket ID
    socket.on("register", (userId) => {
      if (!userId) return;
      userSocketMap[userId] = socket.id; // Map the user ID to socket ID
      socket.join(userId); // Join the user's personal room for notifications
      console.log(`User ${userId} registered with socket ID: ${socket.id}`);
    });

    // Handle joining a unique room for chat between two users
    socket.on("join-room", ({ from, to }) => {
      const roomId = getRoomId(from, to);
      socket.join(roomId);
      console.log(`Users ${from} and ${to} joined room ${roomId}`);
      console.log("Current user-socket map:", userSocketMap);

      // Initialize selectedPartners object for both users if not already present
      if (!selectedPartners[from]) selectedPartners[from] = {};
      if (!selectedPartners[to]) selectedPartners[to] = {};

      // Track mutual selection
      selectedPartners[from][to] = true; // Mark 'to' as selected by 'from'

      if (selectedPartners[to][from]) {
        // Both users have selected each other
        console.log(`Mutual chat detected between ${from} and ${to}`);
        io.to(roomId).emit("mutual-selection", { from, to });
      }
    });

    // Handle sending messages to the specific room
    socket.on("send-message",async (message) => {
      const { from, to, content, timestamp } = message;
      const roomId = getRoomId(from, to);

      // Emit the message to the specific room
      io.to(roomId).emit("receive-message", { from, to, content });
      console.log(
        `Message sent from ${from} to ${to} in room ${roomId} at ${timestamp}`
      );

      // Handle unread message count
      if (!unreadMessages[to]) unreadMessages[to] = {};
      unreadMessages[to][from] = (unreadMessages[to][from] || 0) + 1;
      console.log(
        `Unread count for user ${to} from ${from}: ${unreadMessages[to][from]}`
      );

      // Notify the recipient about the unread message count
      const recipientSocketId = userSocketMap[to];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("update-unread-count", {
          from,
          count: unreadMessages[to][from] || 0,
          timestamp,
        });
        console.log(
          `Update unread count event sent to user ${to} from ${from}: ${unreadMessages[to][from]}`
        );
      }

      // Initialize selectedPartners object for both users if not already present
      if (!selectedPartners[from]) selectedPartners[from] = {};
      if (!selectedPartners[to]) selectedPartners[to] = {};

      // Check if both users are currently chatting with each other
      if (selectedPartners[to][from] && selectedPartners[from][to]) {
        console.log(`Both users ${from} and ${to} are actively chatting.`);
           try {
        await Message.updateMany(
          { to, from, isRead: false },
          { $set: { isRead: true } }
        );
        if (!unreadMessages[to]) {
          unreadMessages[to] = {}; // Initialize if undefined
        }
        unreadMessages[to][from] = 0; // Reset unread count in memory
        console.log(`Unread count reset for user ${to} from ${from}`);
      } catch (error) {
        console.error("Error resetting unread count:", error);
      }
        io.to(roomId).emit("active-chat", { from, to });
      }
    });
4
    // Reset unread message count when the user reads messages
    socket.on("reset-unread-count", async ({ to, from }) => {
      try {
        await Message.updateMany(
          { to, from, isRead: false },
          { $set: { isRead: true } }
        );
        if (!unreadMessages[to]) {
          unreadMessages[to] = {}; // Initialize if undefined
        }
        unreadMessages[to][from] = 0; // Reset unread count in memory
        console.log(`Unread count reset for user ${to} from ${from}`);
      } catch (error) {
        console.error("Error resetting unread count:", error);
      }
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      Object.keys(userSocketMap).forEach((userId) => {
        if (userSocketMap[userId] === socket.id) {
          delete userSocketMap[userId];
          console.log(
            `User ${userId} disconnected and removed from socket map`
          );
        }
      });
    });
  });
};
