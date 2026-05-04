// Server/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },

  // FR13: SOS usage tracking
  sosUsed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);