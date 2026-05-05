const Item = require('../models/Item');
const ItemLocation = require('../models/ItemLocation');
const SavedSearch = require('../models/SavedSearch');
const { haversineDistanceKm } = require('./locationService');
const { sendCampusNotification } = require('./notificationService');
const { appendAuditLog } = require('./auditService');

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

function textMatches(item, q) {
  const query = normalize(q);
  if (!query) return true;
  const haystack = `${item.title || ''} ${item.description || ''} ${item.holderName || ''} ${item.idNumber || ''}`.toLowerCase();
  return query.split(/\s+/).every(token => haystack.includes(token));
}

function simpleFieldMatches(actual, expected) {
  const normalizedExpected = normalize(expected);
  if (!normalizedExpected) return true;
  return normalize(actual) === normalizedExpected;
}

async function itemMatchesSavedSearch(item, savedSearch) {
  const filters = savedSearch.filters || {};
  if (!textMatches(item, filters.q)) return false;
  if (!simpleFieldMatches(item.category, filters.category)) return false;
  if (!simpleFieldMatches(item.status, filters.status)) return false;
  if (!simpleFieldMatches(item.sensitivity, filters.sensitivity)) return false;

  if (filters.zone && !simpleFieldMatches(item.zone, filters.zone)) {
    const location = await ItemLocation.findOne({ itemId: item._id });
    if (!location || !simpleFieldMatches(location.zone, filters.zone)) return false;
  }

  if (filters.coordinates && filters.coordinates.lat !== undefined && filters.coordinates.lng !== undefined) {
    const location = await ItemLocation.findOne({ itemId: item._id });
    if (!location || !location.coordinates) return false;
    const distanceKm = haversineDistanceKm(
      { lat: Number(filters.coordinates.lat), lng: Number(filters.coordinates.lng) },
      location.coordinates
    );
    if (distanceKm === null || distanceKm > Number(filters.coordinates.radiusKm || 1)) return false;
  }

  return true;
}

function buildItemQuery(filters = {}) {
  const query = { isHidden: { $ne: true } };
  if (filters.category) query.category = filters.category;
  if (filters.status) query.status = filters.status;
  if (filters.sensitivity) query.sensitivity = filters.sensitivity;
  if (filters.zone) query.zone = new RegExp(`^${String(filters.zone).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  return query;
}

async function findCurrentMatches(savedSearch, limit = 25) {
  const query = buildItemQuery(savedSearch.filters || {});
  const items = await Item.find(query).select('-bcvAnswerHash').sort({ createdAt: -1 }).limit(100);
  const matches = [];
  for (const item of items) {
    if (await itemMatchesSavedSearch(item, savedSearch)) matches.push(item);
    if (matches.length >= limit) break;
  }
  return matches;
}

async function sendSavedSearchAlertsForItem(item, actorEmail = 'system') {
  const savedSearches = await SavedSearch.find({
    alertsEnabled: true,
    alertedItemIds: { $ne: item._id }
  });

  const alerted = [];
  for (const savedSearch of savedSearches) {
    if (!(await itemMatchesSavedSearch(item, savedSearch))) continue;

    await sendCampusNotification({
      recipientEmail: savedSearch.userEmail,
      trigger: 'saved.search.alert',
      subject: `CampusBeacon saved search match: ${savedSearch.name}`,
      message: `A new item matches your saved search "${savedSearch.name}": ${item.title}.`,
      itemId: item._id,
      actorEmail,
      channels: ['inApp', 'email', 'push'],
      metadata: { savedSearchId: savedSearch._id, savedSearchName: savedSearch.name }
    });

    savedSearch.lastAlertedAt = new Date();
    savedSearch.lastCheckedAt = new Date();
    savedSearch.alertedItemIds.push(item._id);
    await savedSearch.save();
    alerted.push(savedSearch);
  }

  if (alerted.length > 0) {
    await appendAuditLog({
      eventType: 'savedSearch.alerts.sent',
      actorEmail,
      targetType: 'Item',
      targetId: item._id,
      itemId: item._id,
      message: `Saved search alerts sent for item ${item.title}`,
      metadata: { savedSearchIds: alerted.map(s => s._id) }
    });
  }

  return alerted;
}

async function scanSavedSearchAlerts({ since = null, actorEmail = 'system', limit = 100 } = {}) {
  const query = { isHidden: { $ne: true } };
  if (since) query.createdAt = { $gte: new Date(since) };
  const items = await Item.find(query).sort({ createdAt: -1 }).limit(limit);
  const results = [];
  for (const item of items) {
    const matchedSearches = await sendSavedSearchAlertsForItem(item, actorEmail);
    results.push({ itemId: item._id, matchedCount: matchedSearches.length });
  }
  return results;
}

module.exports = {
  itemMatchesSavedSearch,
  findCurrentMatches,
  sendSavedSearchAlertsForItem,
  scanSavedSearchAlerts
};
