const Item = require('../models/Item');
const Claim = require('../models/Claim');
const AuditLog = require('../models/AuditLog');
const { appendAuditLog, listAuditLogs } = require('../services/auditService');

const adminEmails = [
  'najiba.ahmed@g.bracu.ac.bd',
  'alio.das.avik@g.bracu.ac.bd',
  'rafiul.bari@g.bracu.ac.bd',
  'samia.rahman@g.bracu.ac.bd'
];

function isAdminEmail(email) {
  return adminEmails.includes(String(email || '').toLowerCase());
}

exports.listAuditLogs = async (req, res) => {
  try {
    const logs = await listAuditLogs(req.query);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getItemAuditTrail = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.postedByEmail !== req.user.email && !isAdminEmail(req.user.email)) {
      return res.status(403).json({ message: 'Not authorized to view this item history' });
    }

    const logs = await AuditLog.find({ itemId: item._id }).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getClaimAuditTrail = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId).populate('itemId');
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    const item = claim.itemId;
    const allowed = isAdminEmail(req.user.email) || claim.claimerEmail === req.user.email || item?.postedByEmail === req.user.email;
    if (!allowed) return res.status(403).json({ message: 'Not authorized to view this claim history' });

    const logs = await AuditLog.find({ $or: [{ claimId: claim._id }, { targetId: claim._id }] }).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createAuditEntry = async (req, res) => {
  try {
    const log = await appendAuditLog({
      eventType: req.body.eventType || 'client.event',
      actorEmail: req.user.email,
      targetType: req.body.targetType || 'System',
      targetId: req.body.targetId || null,
      itemId: req.body.itemId || null,
      claimId: req.body.claimId || null,
      message: req.body.message || '',
      metadata: req.body.metadata || {},
      req
    });

    if (!log) return res.status(400).json({ message: 'Audit entry could not be created' });
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
