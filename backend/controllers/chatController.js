const Message = require('../models/Message');
const User = require('../models/User');
const userSocketMap = {}; // Make sure to include this here if it's in chatSocket


exports.getUsers = async (req, res) => {
   try {
      const users = await User.find().select('username');
      res.json(users);
   } catch (err) {
      res.status(500).json({ msg: 'Error fetching users' });
   }
};


exports.getMessages = async (req, res) => {
   const { from, to } = req.params;
   console.log('Getting messages from:', from, 'to:', to); // Add logging

   try {
      const messages = await Message.find({
         $or: [
            { from, to },
            { from: to, to: from },
         ],
      }).sort({ timestamp: 1 }); 

      res.json(messages);
   } catch (err) {
      console.error('Error fetching messages:', err);
      res.status(500).json({ msg: 'Error fetching messages' });
   }
};

exports.saveMessage = async (req, res) => {
   const { from, to, content } = req.body;

   // Validate input
   if (!from || !to || !content) {
      return res.status(400).json({ error: 'Missing fields' });
   }

   try {
      const message = new Message({ from, to, content, timestamp: new Date() });
      await message.save();
      res.status(200).json(message); // Respond with the saved message
   } catch (error) {
      console.error('Error saving message:', error.message);
      res.status(500).json({ error: 'Failed to save message' });
   }
};


// Fetch unread messages count
exports.getUnreadMessagesCount = async (req, res) => {
   const { userId } = req.params;
   try {
      const unreadMessages = await Message.aggregate([
         { $match: { to: userId, isRead: false } },
         { $group: { _id: '$from', count: { $sum: 1 } } }
      ]);
      res.status(200).json(unreadMessages);
   } catch (error) {
      res.status(500).json({ error: 'Failed to fetch unread messages' });
   }
};

