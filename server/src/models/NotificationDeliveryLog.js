const mongoose = require('mongoose');

const deliveryAttemptSchema = new mongoose.Schema({
  attemptedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['Sent', 'Failed', 'Skipped'], required: true },
  errorMessage: { type: String, default: '' }
}, { _id: false });

const notificationDeliveryLogSchema = new mongoose.Schema({
  recipientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  trigger: {
    type: String,
    enum: [
      'claim.request',
      'claim.outcome',
      'bcv.result',
      'sos.event',
      'admin.message',
      'saved.search.alert',
      'general'
    ],
    default: 'general',
    index: true
  },
  channel: { type: String, enum: ['inApp', 'email', 'push'], required: true, index: true },
  status: { type: String, enum: ['Queued', 'Sent', 'Failed', 'Skipped'], default: 'Queued', index: true },
  message: { type: String, required: true },
  subject: { type: String, default: 'CampusBeacon Notification' },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  nextRetryAt: { type: Date, default: null },
  lastError: { type: String, default: '' },
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', default: null },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  claimId: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  attemptsHistory: { type: [deliveryAttemptSchema], default: [] }
}, { timestamps: true });

notificationDeliveryLogSchema.index({ status: 1, nextRetryAt: 1 });
notificationDeliveryLogSchema.index({ recipientEmail: 1, createdAt: -1 });

module.exports = mongoose.model('NotificationDeliveryLog', notificationDeliveryLogSchema);
