const mongoose = require('mongoose');

const channelPreferenceSchema = new mongoose.Schema({
  inApp: { type: Boolean, default: true },
  email: { type: Boolean, default: false },
  push: { type: Boolean, default: false }
}, { _id: false });

const quietHoursSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  start: { type: String, default: '22:00' },
  end: { type: String, default: '07:00' },
  timezone: { type: String, default: 'Asia/Dhaka' }
}, { _id: false });

const notificationPreferenceSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  claimRequests: { type: channelPreferenceSchema, default: () => ({}) },
  claimOutcomes: { type: channelPreferenceSchema, default: () => ({}) },
  bcvResults: { type: channelPreferenceSchema, default: () => ({}) },
  sosEvents: { type: channelPreferenceSchema, default: () => ({ inApp: true, email: true, push: false }) },
  adminMessages: { type: channelPreferenceSchema, default: () => ({ inApp: true, email: true, push: false }) },
  savedSearchAlerts: { type: channelPreferenceSchema, default: () => ({ inApp: true, email: false, push: false }) },
  quietHours: { type: quietHoursSchema, default: () => ({}) }
}, { timestamps: true });

notificationPreferenceSchema.statics.defaultsFor = function defaultsFor(userEmail) {
  return {
    userEmail,
    claimRequests: { inApp: true, email: false, push: false },
    claimOutcomes: { inApp: true, email: false, push: false },
    bcvResults: { inApp: true, email: false, push: false },
    sosEvents: { inApp: true, email: true, push: false },
    adminMessages: { inApp: true, email: true, push: false },
    savedSearchAlerts: { inApp: true, email: false, push: false },
    quietHours: { enabled: false, start: '22:00', end: '07:00', timezone: 'Asia/Dhaka' }
  };
};

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
