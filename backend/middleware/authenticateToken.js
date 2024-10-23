const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
   const token = req.headers['authorization']?.split(' ')[1]; // Assuming the token is sent as "Bearer TOKEN"

   if (!token) return res.status(401).json({ msg: 'Access token is missing' });

   jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (err) return res.status(403).json({ msg: 'Invalid token' });

      // Fetch user from the database based on the id stored in the token
      req.user = await User.findById(user.id);
      next();
   });
};

module.exports = authenticateToken;
