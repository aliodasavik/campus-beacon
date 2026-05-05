const SavedSearch = require('../models/SavedSearch');
const { findCurrentMatches, scanSavedSearchAlerts } = require('../services/savedSearchService');
const { appendAuditLog } = require('../services/auditService');

function cleanFilters(filters = {}) {
  const cleaned = {
    q: filters.q || '',
    category: filters.category || '',
    status: filters.status || '',
    zone: filters.zone || '',
    sensitivity: filters.sensitivity || ''
  };

  if (filters.coordinates && filters.coordinates.lat !== undefined && filters.coordinates.lng !== undefined) {
    cleaned.coordinates = {
      lat: Number(filters.coordinates.lat),
      lng: Number(filters.coordinates.lng),
      radiusKm: Number(filters.coordinates.radiusKm || 1)
    };
  }
  return cleaned;
}

exports.listMySavedSearches = async (req, res) => {
  try {
    const searches = await SavedSearch.find({ userEmail: req.user.email.toLowerCase() }).sort({ updatedAt: -1 });
    res.json(searches);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createSavedSearch = async (req, res) => {
  try {
    const savedSearch = await SavedSearch.create({
      userEmail: req.user.email.toLowerCase(),
      name: req.body.name || 'My saved search',
      filters: cleanFilters(req.body.filters || req.body),
      alertsEnabled: req.body.alertsEnabled !== false
    });

    await appendAuditLog({
      eventType: 'savedSearch.created',
      actorEmail: req.user.email,
      targetType: 'SavedSearch',
      targetId: savedSearch._id,
      message: `Saved search created: ${savedSearch.name}`,
      metadata: savedSearch.filters,
      req
    });

    res.status(201).json(savedSearch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateSavedSearch = async (req, res) => {
  try {
    const savedSearch = await SavedSearch.findOne({ _id: req.params.id, userEmail: req.user.email.toLowerCase() });
    if (!savedSearch) return res.status(404).json({ message: 'Saved search not found' });

    if (req.body.name !== undefined) savedSearch.name = req.body.name;
    if (req.body.filters || req.body.q || req.body.category || req.body.status || req.body.zone) {
      savedSearch.filters = cleanFilters(req.body.filters || req.body);
    }
    if (req.body.alertsEnabled !== undefined) savedSearch.alertsEnabled = Boolean(req.body.alertsEnabled);
    await savedSearch.save();

    await appendAuditLog({
      eventType: 'savedSearch.updated',
      actorEmail: req.user.email,
      targetType: 'SavedSearch',
      targetId: savedSearch._id,
      message: `Saved search updated: ${savedSearch.name}`,
      metadata: savedSearch.filters,
      req
    });

    res.json(savedSearch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteSavedSearch = async (req, res) => {
  try {
    const savedSearch = await SavedSearch.findOneAndDelete({ _id: req.params.id, userEmail: req.user.email.toLowerCase() });
    if (!savedSearch) return res.status(404).json({ message: 'Saved search not found' });

    await appendAuditLog({
      eventType: 'savedSearch.deleted',
      actorEmail: req.user.email,
      targetType: 'SavedSearch',
      targetId: savedSearch._id,
      message: `Saved search deleted: ${savedSearch.name}`,
      req
    });

    res.json({ message: 'Saved search deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.previewMatches = async (req, res) => {
  try {
    const savedSearch = await SavedSearch.findOne({ _id: req.params.id, userEmail: req.user.email.toLowerCase() });
    if (!savedSearch) return res.status(404).json({ message: 'Saved search not found' });
    const matches = await findCurrentMatches(savedSearch, Number(req.query.limit || 25));
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.runMyAlertScan = async (req, res) => {
  try {
    const since = req.body.since || req.query.since || null;
    const results = await scanSavedSearchAlerts({ since, actorEmail: req.user.email });
    res.json({ message: 'Saved search alert scan completed', results });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
