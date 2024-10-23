const express = require('express');
const router = express.Router();
const {
   getUsers,
   getMessages,
   saveMessage,
   getUnreadMessagesCount,
} = require('../controllers/chatController');
const authenticateToken = require('../middleware/authenticateToken');

// Protected route to get current user
router.get('/currentUser', authenticateToken, (req, res) => {
   if (!req.user) {
      return res.status(401).json({ msg: 'Unauthorized' });
   }
   res.json({ id: req.user._id, username: req.user.username, email: req.user.email });
});

// Other routes
router.get('/users', authenticateToken, getUsers);
router.get('/messages/:from/:to', authenticateToken, getMessages);
router.post('/messages', authenticateToken, saveMessage);
router.get('/unread-messages/:userId', authenticateToken, getUnreadMessagesCount);

module.exports = router;
