const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  text: { type: String, required: true },
  sentAt: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  claimId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim',
    required: true,
    unique: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  finderEmail: { type: String, required: true },
  claimerEmail: { type: String, required: true },
  isLocked: { type: Boolean, default: false },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);