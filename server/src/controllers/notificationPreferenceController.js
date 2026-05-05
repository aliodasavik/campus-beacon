const NotificationPreference = require('../models/NotificationPreference');
const NotificationDeliveryLog = require('../models/NotificationDeliveryLog');
const { sendCampusNotification, retryDeliveryLog, retryFailedDeliveries, getOrCreatePreferences } = require('../services/notificationService');
const { appendAuditLog } = require('../services/auditService');

const preferenceKeys = [
  'claimRequests',
  'claimOutcomes',
  'bcvResults',
  'sosEvents',
  'adminMessages',
  'savedSearchAlerts'
];

function sanitizeChannelGroup(value = {}) {
  return {
    inApp: value.inApp !== false,
    email: Boolean(value.email),
    push: Boolean(value.push)
  };
}

function sanitizePreferences(body = {}) {
  const update = {};
  for (const key of preferenceKeys) {
    if (body[key]) update[key] = sanitizeChannelGroup(body[key]);
  }

  if (body.quietHours) {
    update.quietHours = {
      enabled: Boolean(body.quietHours.enabled),
      start: String(body.quietHours.start || '22:00'),
      end: String(body.quietHours.end || '07:00'),
      timezone: String(body.quietHours.timezone || 'Asia/Dhaka')
    };
  }
  return update;
}

exports.getMyPreferences = async (req, res) => {
  try {
    const preferences = await getOrCreatePreferences(req.user.email);
    res.json(preferences);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateMyPreferences = async (req, res) => {
  try {
    const update = sanitizePreferences(req.body);
    const preferences = await NotificationPreference.findOneAndUpdate(
      { userEmail: req.user.email.toLowerCase() },
      { $set: update, $setOnInsert: { userEmail: req.user.email.toLowerCase() } },
      { new: true, upsert: true, runValidators: true }
    );

    await appendAuditLog({
      eventType: 'notification.preferences.updated',
      actorEmail: req.user.email,
      targetType: 'Notification',
      message: 'Notification preferences updated',
      metadata: update,
      req
    });

    res.json(preferences);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.sendTestNotification = async (req, res) => {
  try {
    const results = await sendCampusNotification({
      recipientEmail: req.user.email,
      trigger: 'admin.message',
      subject: 'CampusBeacon test notification',
      message: 'This is a test notification from CampusBeacon.',
      actorEmail: req.user.email,
      channels: req.body.channels || ['inApp', 'email', 'push'],
      metadata: { test: true }
    });
    res.status(201).json({ message: 'Test notification processed', results });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyDeliveryLogs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const logs = await NotificationDeliveryLog.find({ recipientEmail: req.user.email.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.retryOneDelivery = async (req, res) => {
  try {
    const log = await NotificationDeliveryLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Delivery log not found' });
    if (log.recipientEmail !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: 'Not authorized to retry this notification' });
    }
    const result = await retryDeliveryLog(log._id, req.user.email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.retryMyFailedDeliveries = async (req, res) => {
  try {
    const results = await retryFailedDeliveries(req.user.email);
    res.json({ retried: results.length, results });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
