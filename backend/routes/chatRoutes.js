const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

const {
  getUsers,
  getMessages,
  saveMessage,
  getUnreadMessagesCount,
} = require("../controllers/chatController");
const authenticateToken = require("../middleware/authenticateToken");
const upload = require("../middleware/upload");

// Protected route to get current user
router.get("/currentUser", authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
  res.json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
  });
});

// Other routes
router.get("/users", authenticateToken, getUsers);
router.get("/messages/:from/:to", authenticateToken, getMessages);
router.post("/messages", authenticateToken, saveMessage);
router.get(
  "/unread-messages/:userId",
  authenticateToken,
  getUnreadMessagesCount
);
router.post("/messages/image", upload, async (req, res) => {
  const { from, to } = req.body;

  // Validate input
  if (!from || !to || !req.file) {
    return res
      .status(400)
      .json({ error: "Missing fields or no image uploaded" });
  }

  try {
    const imageUrl = req.file.path; // Path to the uploaded image
    console.log(" image ka url ",imageUrl)
    const message = new Message({
      from,
      to,
      content: { type: "image", url: imageUrl }, // Structure as needed
      timestamp: new Date(),
    });

    await message.save();
    res.status(200).json(message); // Respond with the saved message
  } catch (error) {
    console.error("Error saving image message:", error.message);
    res.status(500).json({ error: "Failed to save message" });
  }
});
module.exports = router;
