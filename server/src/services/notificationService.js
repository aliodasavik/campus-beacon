const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationDeliveryLog = require('../models/NotificationDeliveryLog');
const { appendAuditLog } = require('./auditService');

const triggerPreferenceMap = {
  'claim.request': 'claimRequests',
  'claim.outcome': 'claimOutcomes',
  'bcv.result': 'bcvResults',
  'sos.event': 'sosEvents',
  'admin.message': 'adminMessages',
  'saved.search.alert': 'savedSearchAlerts',
  general: 'adminMessages'
};

function notificationTypeForTrigger(trigger) {
  if (trigger === 'claim.request') return 'ClaimRequest';
  if (trigger === 'claim.outcome' || trigger === 'bcv.result') return 'ClaimUpdate';
  return 'Alert';
}

let cachedTransporter = null;
function getEmailTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return cachedTransporter;
}

async function getOrCreatePreferences(userEmail) {
  const normalizedEmail = String(userEmail || '').toLowerCase().trim();
  let preferences = await NotificationPreference.findOne({ userEmail: normalizedEmail });
  if (!preferences) {
    preferences = await NotificationPreference.create(NotificationPreference.defaultsFor(normalizedEmail));
  }
  return preferences;
}

function channelIsEnabled(preferences, trigger, channel, force) {
  if (force) return true;
  const key = triggerPreferenceMap[trigger] || 'adminMessages';
  const group = preferences[key] || {};
  return group[channel] !== false;
}

async function writeDeliveryLog(payload) {
  return NotificationDeliveryLog.create(payload);
}

async function markLog(log, { status, errorMessage = '', notificationId = null }) {
  log.status = status;
  log.attempts += 1;
  log.lastError = errorMessage;
  if (notificationId) log.notificationId = notificationId;
  log.attemptsHistory.push({ status, errorMessage });
  if (status === 'Failed' && log.attempts < log.maxAttempts) {
    const backoffMinutes = Math.pow(2, Math.max(log.attempts - 1, 0));
    log.nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
  } else {
    log.nextRetryAt = null;
  }
  await log.save();
  return log;
}

async function dispatchInApp({ recipientEmail, message, trigger, itemId, claimId, metadata, subject }) {
  const log = await writeDeliveryLog({
    recipientEmail,
    trigger,
    channel: 'inApp',
    message,
    subject,
    itemId: itemId || null,
    claimId: claimId || null,
    metadata
  });

  try {
    const notification = await Notification.create({
      recipientEmail,
      message,
      claimId: claimId || undefined,
      type: notificationTypeForTrigger(trigger)
    });
    return markLog(log, { status: 'Sent', notificationId: notification._id });
  } catch (err) {
    return markLog(log, { status: 'Failed', errorMessage: err.message });
  }
}

async function dispatchEmail({ recipientEmail, message, subject, trigger, itemId, claimId, metadata }) {
  const log = await writeDeliveryLog({
    recipientEmail,
    trigger,
    channel: 'email',
    message,
    subject,
    itemId: itemId || null,
    claimId: claimId || null,
    metadata
  });

  const transporter = getEmailTransporter();
  if (!transporter) {
    return markLog(log, {
      status: 'Skipped',
      errorMessage: 'EMAIL_USER and EMAIL_PASS are not configured. In-app notification can still be used.'
    });
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipientEmail,
      subject,
      text: message
    });
    return markLog(log, { status: 'Sent' });
  } catch (err) {
    return markLog(log, { status: 'Failed', errorMessage: err.message });
  }
}

async function dispatchPush({ recipientEmail, message, subject, trigger, itemId, claimId, metadata }) {
  const log = await writeDeliveryLog({
    recipientEmail,
    trigger,
    channel: 'push',
    message,
    subject,
    itemId: itemId || null,
    claimId: claimId || null,
    metadata
  });

  if (!global.campusBeaconPushProvider || typeof global.campusBeaconPushProvider.send !== 'function') {
    return markLog(log, {
      status: 'Skipped',
      errorMessage: 'Push provider is not configured. Add a push provider later without changing this API.'
    });
  }

  try {
    await global.campusBeaconPushProvider.send(recipientEmail, { title: subject, body: message, metadata });
    return markLog(log, { status: 'Sent' });
  } catch (err) {
    return markLog(log, { status: 'Failed', errorMessage: err.message });
  }
}

async function sendCampusNotification(options = {}) {
  const recipientEmail = String(options.recipientEmail || '').toLowerCase().trim();
  if (!recipientEmail) throw new Error('recipientEmail is required');

  const trigger = options.trigger || 'general';
  const message = options.message || 'You have a new CampusBeacon notification.';
  const subject = options.subject || 'CampusBeacon Notification';
  const metadata = options.metadata || {};
  const itemId = options.itemId || null;
  const claimId = options.claimId || null;
  const force = Boolean(options.force);
  const channels = Array.isArray(options.channels) && options.channels.length > 0
    ? options.channels
    : ['inApp', 'email', 'push'];

  const preferences = await getOrCreatePreferences(recipientEmail);
  const results = [];

  for (const channel of channels) {
    if (!['inApp', 'email', 'push'].includes(channel)) continue;

    if (!channelIsEnabled(preferences, trigger, channel, force)) {
      const skipped = await writeDeliveryLog({
        recipientEmail,
        trigger,
        channel,
        status: 'Skipped',
        message,
        subject,
        itemId,
        claimId,
        metadata,
        attempts: 1,
        attemptsHistory: [{ status: 'Skipped', errorMessage: 'Disabled by user preference' }],
        lastError: 'Disabled by user preference'
      });
      results.push(skipped);
      continue;
    }

    if (channel === 'inApp') results.push(await dispatchInApp({ recipientEmail, message, subject, trigger, itemId, claimId, metadata }));
    if (channel === 'email') results.push(await dispatchEmail({ recipientEmail, message, subject, trigger, itemId, claimId, metadata }));
    if (channel === 'push') results.push(await dispatchPush({ recipientEmail, message, subject, trigger, itemId, claimId, metadata }));
  }

  await appendAuditLog({
    eventType: 'notification.dispatch',
    actorEmail: options.actorEmail || recipientEmail,
    targetType: 'Notification',
    itemId,
    claimId,
    message: `Notification dispatch requested for ${recipientEmail}`,
    metadata: { trigger, channels, resultStatuses: results.map(r => ({ channel: r.channel, status: r.status })) }
  });

  return results;
}

async function retryDeliveryLog(logId, actorEmail) {
  const log = await NotificationDeliveryLog.findById(logId);
  if (!log) throw new Error('Delivery log not found');
  if (!['Failed', 'Queued'].includes(log.status)) return log;
  if (log.attempts >= log.maxAttempts) throw new Error('Maximum retry attempts reached');

  if (log.channel === 'inApp') {
    const notification = await Notification.create({
      recipientEmail: log.recipientEmail,
      message: log.message,
      claimId: log.claimId || undefined,
      type: notificationTypeForTrigger(log.trigger)
    });
    await appendAuditLog({
      eventType: 'notification.retry',
      actorEmail,
      targetType: 'Notification',
      targetId: log.notificationId,
      message: 'In-app notification retry completed'
    });
    return markLog(log, { status: 'Sent', notificationId: notification._id });
  }

  if (log.channel === 'email') {
    const transporter = getEmailTransporter();
    if (!transporter) return markLog(log, { status: 'Skipped', errorMessage: 'EMAIL_USER and EMAIL_PASS are not configured.' });
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: log.recipientEmail,
        subject: log.subject,
        text: log.message
      });
      await appendAuditLog({ eventType: 'notification.retry', actorEmail, targetType: 'Notification', message: 'Email retry completed' });
      return markLog(log, { status: 'Sent' });
    } catch (err) {
      return markLog(log, { status: 'Failed', errorMessage: err.message });
    }
  }

  if (log.channel === 'push') {
    if (!global.campusBeaconPushProvider || typeof global.campusBeaconPushProvider.send !== 'function') {
      return markLog(log, { status: 'Skipped', errorMessage: 'Push provider is not configured.' });
    }
    try {
      await global.campusBeaconPushProvider.send(log.recipientEmail, { title: log.subject, body: log.message, metadata: log.metadata });
      await appendAuditLog({ eventType: 'notification.retry', actorEmail, targetType: 'Notification', message: 'Push retry completed' });
      return markLog(log, { status: 'Sent' });
    } catch (err) {
      return markLog(log, { status: 'Failed', errorMessage: err.message });
    }
  }

  return log;
}

async function retryFailedDeliveries(actorEmail = 'system') {
  const now = new Date();
  const logs = await NotificationDeliveryLog.find({
    status: 'Failed',
    attempts: { $lt: 3 },
    $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }]
  }).limit(50);

  const results = [];
  for (const log of logs) {
    results.push(await retryDeliveryLog(log._id, actorEmail));
  }
  return results;
}

module.exports = {
  sendCampusNotification,
  retryDeliveryLog,
  retryFailedDeliveries,
  getOrCreatePreferences,
  notificationTypeForTrigger
};
