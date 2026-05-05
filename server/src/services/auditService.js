const AuditLog = require('../models/AuditLog');

function reqMeta(req) {
  if (!req) return {};
  return {
    ipAddress: req.ip || req.connection?.remoteAddress || '',
    userAgent: req.get ? req.get('user-agent') || '' : ''
  };
}

async function appendAuditLog({
  eventType,
  actorEmail,
  targetType = 'System',
  targetId = null,
  itemId = null,
  claimId = null,
  message = '',
  metadata = {},
  req = null
}) {
  try {
    if (!eventType || !actorEmail) return null;
    const extra = reqMeta(req);
    return await AuditLog.create({
      eventType,
      actorEmail,
      targetType,
      targetId,
      itemId,
      claimId,
      message,
      metadata,
      ...extra
    });
  } catch (err) {
    console.error('Audit log append failed:', err.message);
    return null;
  }
}

function buildAuditQuery(query = {}) {
  const filter = {};
  if (query.eventType) filter.eventType = query.eventType;
  if (query.actorEmail) filter.actorEmail = String(query.actorEmail).toLowerCase();
  if (query.targetType) filter.targetType = query.targetType;
  if (query.targetId) filter.targetId = query.targetId;
  if (query.itemId) filter.itemId = query.itemId;
  if (query.claimId) filter.claimId = query.claimId;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }
  return filter;
}

async function listAuditLogs(query = {}, options = {}) {
  const limit = Math.min(Number(options.limit || query.limit || 100), 500);
  const skip = Math.max(Number(options.skip || query.skip || 0), 0);
  return AuditLog.find(buildAuditQuery(query)).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

module.exports = {
  appendAuditLog,
  listAuditLogs,
  buildAuditQuery
};
