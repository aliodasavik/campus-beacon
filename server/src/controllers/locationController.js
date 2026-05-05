const Item = require('../models/Item');
const ItemLocation = require('../models/ItemLocation');
const CampusZone = require('../models/CampusZone');
const { upsertItemLocation, validateCoordinates, haversineDistanceKm } = require('../services/locationService');
const { appendAuditLog } = require('../services/auditService');

const adminEmails = [
  'najiba.ahmed@g.bracu.ac.bd',
  'alio.das.avik@g.bracu.ac.bd',
  'rafiul.bari@g.bracu.ac.bd',
  'samia.rahman@g.bracu.ac.bd'
];

function isAdminEmail(email) {
  return adminEmails.includes(String(email || '').toLowerCase());
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.upsertItemLocation = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const allowed = item.postedByEmail === req.user.email || isAdminEmail(req.user.email);
    if (!allowed) return res.status(403).json({ message: 'Only the item poster or an admin can update location tags.' });

    const location = await upsertItemLocation({ item, body: req.body, userEmail: req.user.email });
    await appendAuditLog({
      eventType: 'item.location.updated',
      actorEmail: req.user.email,
      targetType: 'Item',
      targetId: item._id,
      itemId: item._id,
      message: `Location updated for ${item.title}`,
      metadata: location.toObject(),
      req
    });

    res.json({ item, location });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getItemLocation = async (req, res) => {
  try {
    const location = await ItemLocation.findOne({ itemId: req.params.itemId });
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listCampusZones = async (req, res) => {
  try {
    const zones = await CampusZone.find({ active: { $ne: false } }).sort({ name: 1 });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createCampusZone = async (req, res) => {
  try {
    const coordinates = validateCoordinates(req.body.lat ?? req.body.center?.lat, req.body.lng ?? req.body.center?.lng);
    const zone = await CampusZone.create({
      name: req.body.name,
      aliases: Array.isArray(req.body.aliases) ? req.body.aliases : [],
      description: req.body.description || '',
      center: coordinates,
      createdByEmail: req.user.email
    });

    await appendAuditLog({
      eventType: 'campusZone.created',
      actorEmail: req.user.email,
      targetType: 'System',
      message: `Campus zone created: ${zone.name}`,
      metadata: zone.toObject(),
      req
    });

    res.status(201).json(zone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.listItemsByLocation = async (req, res) => {
  try {
    const locationFilter = {};
    if (req.query.zone) locationFilter.zone = new RegExp(`^${escapeRegExp(req.query.zone)}$`, 'i');

    const locations = await ItemLocation.find(locationFilter).sort({ updatedAt: -1 }).limit(500);
    const locationByItemId = new Map(locations.map(location => [String(location.itemId), location]));
    const itemIds = locations.map(location => location.itemId);

    const itemFilter = { _id: { $in: itemIds }, isHidden: { $ne: true } };
    if (req.query.category) itemFilter.category = req.query.category;
    if (req.query.status) itemFilter.status = req.query.status;

    const items = await Item.find(itemFilter).select('-bcvAnswerHash');
    const origin = validateCoordinates(req.query.lat, req.query.lng);
    const radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : null;

    let rows = items.map(item => {
      const location = locationByItemId.get(String(item._id));
      const distanceKm = origin && location?.coordinates ? haversineDistanceKm(origin, location.coordinates) : null;
      return { ...item.toObject(), location, distanceKm };
    });

    if (origin && Number.isFinite(radiusKm)) {
      rows = rows.filter(row => row.distanceKm !== null && row.distanceKm <= radiusKm);
    }

    if (origin || req.query.sort === 'proximity') {
      rows.sort((a, b) => (a.distanceKm ?? Number.MAX_VALUE) - (b.distanceKm ?? Number.MAX_VALUE));
    } else {
      rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json(rows);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
