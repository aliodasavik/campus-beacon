const mongoose = require('mongoose');

const coordinateSchema = new mongoose.Schema({
  lat: { type: Number, min: -90, max: 90 },
  lng: { type: Number, min: -180, max: 180 }
}, { _id: false });

const itemLocationSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    unique: true,
    index: true
  },
  zone: { type: String, required: true, trim: true, index: true },
  building: { type: String, default: '', trim: true },
  floor: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  coordinates: { type: coordinateSchema, default: null },
  precision: {
    type: String,
    enum: ['zone', 'building', 'floor', 'exact'],
    default: 'zone'
  },
  createdByEmail: { type: String, required: true, lowercase: true, trim: true },
  updatedByEmail: { type: String, required: true, lowercase: true, trim: true }
}, { timestamps: true });

itemLocationSchema.index({ zone: 1, updatedAt: -1 });
itemLocationSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

module.exports = mongoose.model('ItemLocation', itemLocationSchema);
