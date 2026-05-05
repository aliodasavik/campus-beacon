const ItemLocation = require('../models/ItemLocation');

function cleanText(value) {
  return String(value || '').trim();
}

function validateCoordinates(lat, lng) {
  if (lat === undefined || lat === null || lat === '' || lng === undefined || lng === null || lng === '') {
    return null;
  }

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
    throw new Error('Latitude and longitude must be valid numbers.');
  }
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    throw new Error('Coordinates are outside the valid latitude/longitude range.');
  }
  return { lat: parsedLat, lng: parsedLng };
}

function haversineDistanceKm(a, b) {
  if (!a || !b) return null;
  const toRad = degrees => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function normalizeLocationPayload(body = {}) {
  const zone = cleanText(body.zone);
  if (!zone) throw new Error('A campus zone is required.');

  return {
    zone,
    building: cleanText(body.building),
    floor: cleanText(body.floor),
    description: cleanText(body.description),
    coordinates: validateCoordinates(body.lat ?? body.latitude ?? body.coordinates?.lat, body.lng ?? body.longitude ?? body.coordinates?.lng),
    precision: ['zone', 'building', 'floor', 'exact'].includes(body.precision) ? body.precision : 'zone'
  };
}

async function upsertItemLocation({ item, body, userEmail }) {
  const payload = normalizeLocationPayload(body);
  const existing = await ItemLocation.findOne({ itemId: item._id });

  const update = {
    ...payload,
    updatedByEmail: userEmail
  };

  if (!existing) update.createdByEmail = userEmail;

  const location = await ItemLocation.findOneAndUpdate(
    { itemId: item._id },
    { $set: update, $setOnInsert: { createdByEmail: userEmail } },
    { new: true, upsert: true, runValidators: true }
  );

  if (item.zone !== payload.zone) {
    item.zone = payload.zone;
    await item.save();
  }

  return location;
}

module.exports = {
  validateCoordinates,
  haversineDistanceKm,
  normalizeLocationPayload,
  upsertItemLocation
};
