const mongoose = require('mongoose');

const coordinateSchema = new mongoose.Schema({
  lat: { type: Number, min: -90, max: 90 },
  lng: { type: Number, min: -180, max: 180 }
}, { _id: false });

const campusZoneSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, index: true },
  aliases: { type: [String], default: [] },
  description: { type: String, default: '' },
  center: { type: coordinateSchema, default: null },
  active: { type: Boolean, default: true },
  createdByEmail: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('CampusZone', campusZoneSchema);
