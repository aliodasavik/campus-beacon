const PostArchive = require('../models/PostArchive');
const { getArchiveState, archiveItem, extendRetention, archiveExpiredPosts } = require('../services/archiveService');

exports.getArchiveState = async (req, res) => {
  try {
    const archive = await getArchiveState(req.params.itemId);
    res.json(archive || { itemId: req.params.itemId, isArchived: false, readOnly: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listArchives = async (req, res) => {
  try {
    const archives = await PostArchive.find(req.query.isArchived === 'false' ? { isArchived: false } : {})
      .populate('itemId', 'title category status postedByEmail createdAt')
      .sort({ updatedAt: -1 })
      .limit(Math.min(Number(req.query.limit || 100), 500));
    res.json(archives);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.archiveOneItem = async (req, res) => {
  try {
    const result = await archiveItem({
      itemId: req.params.itemId,
      actorEmail: req.user.email,
      reason: req.body.reason || 'manual_admin_archive',
      req
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.extendItemRetention = async (req, res) => {
  try {
    const result = await extendRetention({
      itemId: req.params.itemId,
      days: req.body.days || 30,
      actorEmail: req.user.email,
      reason: req.body.reason || '',
      req
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.runArchiveJob = async (req, res) => {
  try {
    const result = await archiveExpiredPosts({
      actorEmail: req.user.email,
      limit: Number(req.body.limit || req.query.limit || 100)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
