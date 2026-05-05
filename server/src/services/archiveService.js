const Item = require('../models/Item');
const PostArchive = require('../models/PostArchive');
const { appendAuditLog } = require('./auditService');

function getRetentionDays() {
  const parsed = Number(process.env.POST_RETENTION_DAYS || 90);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 90;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function getArchiveState(itemId) {
  return PostArchive.findOne({ itemId });
}

async function isItemArchived(itemId) {
  const state = await getArchiveState(itemId);
  return Boolean(state && state.isArchived);
}

async function archiveItem({ itemId, actorEmail = 'system', reason = 'retention_expired', req = null }) {
  const item = await Item.findById(itemId);
  if (!item) throw new Error('Item not found');

  let archive = await PostArchive.findOne({ itemId: item._id });
  if (!archive) {
    archive = new PostArchive({
      itemId: item._id,
      originalStatus: item.status,
      retentionUntil: addDays(item.createdAt || new Date(), getRetentionDays())
    });
  }

  if (archive.isArchived) return { item, archive, alreadyArchived: true };

  archive.isArchived = true;
  archive.readOnly = true;
  archive.archivedAt = new Date();
  archive.archivedByEmail = actorEmail;
  archive.archiveReason = reason;
  archive.originalStatus = archive.originalStatus || item.status;
  await archive.save();

  if (item.status !== 'Resolved') {
    item.status = 'Resolved';
    await item.save();
  }

  await appendAuditLog({
    eventType: 'post.archived',
    actorEmail,
    targetType: 'Archive',
    targetId: archive._id,
    itemId: item._id,
    message: `Post archived: ${item.title}`,
    metadata: { reason, originalStatus: archive.originalStatus },
    req
  });

  return { item, archive, alreadyArchived: false };
}

async function extendRetention({ itemId, days, actorEmail, reason = '', req = null }) {
  const item = await Item.findById(itemId);
  if (!item) throw new Error('Item not found');

  const extensionDays = Number(days);
  if (!Number.isFinite(extensionDays) || extensionDays <= 0) {
    throw new Error('Extension days must be a positive number.');
  }

  const newRetentionUntil = addDays(new Date(), extensionDays);
  const archive = await PostArchive.findOneAndUpdate(
    { itemId: item._id },
    {
      $set: {
        isArchived: false,
        readOnly: false,
        retentionUntil: newRetentionUntil,
        extendedByEmail: actorEmail,
        extensionReason: reason
      },
      $setOnInsert: { originalStatus: item.status }
    },
    { new: true, upsert: true, runValidators: true }
  );

  if (archive.originalStatus && item.status === 'Resolved' && archive.originalStatus !== 'Resolved') {
    item.status = archive.originalStatus;
    await item.save();
  }

  await appendAuditLog({
    eventType: 'post.retention.extended',
    actorEmail,
    targetType: 'Archive',
    targetId: archive._id,
    itemId: item._id,
    message: `Retention extended for ${item.title}`,
    metadata: { days: extensionDays, retentionUntil: newRetentionUntil, reason },
    req
  });

  return { item, archive };
}

async function archiveExpiredPosts({ actorEmail = 'system', now = new Date(), limit = 100 } = {}) {
  const retentionDays = getRetentionDays();
  const defaultCutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

  const activeOverrides = await PostArchive.find({
    isArchived: false,
    retentionUntil: { $gt: now }
  }).select('itemId');
  const excludedIds = activeOverrides.map(override => override.itemId);

  const alreadyArchived = await PostArchive.find({ isArchived: true }).select('itemId');
  const alreadyArchivedIds = alreadyArchived.map(archive => archive.itemId);

  const items = await Item.find({
    _id: { $nin: [...excludedIds, ...alreadyArchivedIds] },
    createdAt: { $lte: defaultCutoff }
  }).sort({ createdAt: 1 }).limit(limit);

  const archived = [];
  for (const item of items) {
    const result = await archiveItem({ itemId: item._id, actorEmail, reason: 'retention_expired' });
    archived.push(result.archive);
  }

  return { retentionDays, checkedAt: now, archivedCount: archived.length, archives: archived };
}

module.exports = {
  getRetentionDays,
  getArchiveState,
  isItemArchived,
  archiveItem,
  extendRetention,
  archiveExpiredPosts
};
