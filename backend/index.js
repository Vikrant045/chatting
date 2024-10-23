const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { chatSocket } = require('./sockets/chatSocket');

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
   cors: {
      origin: '*', // Update for production if needed
      methods: ["GET", "POST"],
   },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Socket.io connection
chatSocket(io);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
   .then(() => console.log('MongoDB connected'))
   .catch(err => console.log('MongoDB connection error:', err));


// Start the server
const PORT = process.env.PORT || 8002;
server.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});
