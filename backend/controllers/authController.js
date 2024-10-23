const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Signup logic
exports.signup = async (req, res) => {
   const { username, email, password } = req.body;
   try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ msg: 'User already exists' });

      const user = new User({ username, email, password });
      await user.save();

      res.status(201).json({ msg: 'User created successfully' });
   } catch (err) {
      res.status(500).json({ msg: 'Error in creating user' });
   }
};

// Login logic
exports.login = async (req, res) => {
   const { email, password } = req.body;
   try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ msg: 'User not found' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
      res.json({ token, user: { id: user._id, username: user.username } });
   } catch (err) {
      res.status(500).json({ msg: 'Server error' });
   }
};
