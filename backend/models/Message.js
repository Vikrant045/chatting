const mongoose = require('mongoose');

// const messageSchema = new mongoose.Schema({
//    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//    content: { type: String, required: true },
//    timestamp: { type: Date, default: Date.now },
// });

const messageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: {
    type: mongoose.Schema.Types.Mixed, // Change to Mixed to allow any data type
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});




const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
