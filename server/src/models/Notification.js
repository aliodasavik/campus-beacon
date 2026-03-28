const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientEmail: { type: String, required: true },
  message: { type: String, required: true },
  claimId: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim' },
  type: { type: String, enum: ['ClaimRequest', 'ClaimUpdate', 'Alert'], default: 'Alert' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);