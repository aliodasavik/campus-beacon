const mongoose = require('mongoose');

const postArchiveSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
    unique: true,
    index: true
  },
  isArchived: { type: Boolean, default: false, index: true },
  readOnly: { type: Boolean, default: false },
  originalStatus: { type: String, default: '' },
  archivedAt: { type: Date, default: null, index: true },
  archivedByEmail: { type: String, default: '', lowercase: true, trim: true },
  archiveReason: { type: String, default: '' },
  retentionUntil: { type: Date, default: null, index: true },
  extendedByEmail: { type: String, default: '', lowercase: true, trim: true },
  extensionReason: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

postArchiveSchema.index({ isArchived: 1, retentionUntil: 1 });

module.exports = mongoose.model('PostArchive', postArchiveSchema);
