const mongoose = require('mongoose');

const coordinateFilterSchema = new mongoose.Schema({
  lat: { type: Number, min: -90, max: 90 },
  lng: { type: Number, min: -180, max: 180 },
  radiusKm: { type: Number, min: 0, default: 1 }
}, { _id: false });

const savedSearchFilterSchema = new mongoose.Schema({
  q: { type: String, default: '', trim: true },
  category: { type: String, default: '', trim: true },
  status: { type: String, default: '', trim: true },
  zone: { type: String, default: '', trim: true },
  sensitivity: { type: String, default: '', trim: true },
  coordinates: { type: coordinateFilterSchema, default: null }
}, { _id: false });

const savedSearchSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  filters: { type: savedSearchFilterSchema, default: () => ({}) },
  alertsEnabled: { type: Boolean, default: true, index: true },
  lastCheckedAt: { type: Date, default: null },
  lastAlertedAt: { type: Date, default: null },
  alertedItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }]
}, { timestamps: true });

savedSearchSchema.index({ userEmail: 1, name: 1 }, { unique: true });
savedSearchSchema.index({ alertsEnabled: 1, updatedAt: -1 });

module.exports = mongoose.model('SavedSearch', savedSearchSchema);
