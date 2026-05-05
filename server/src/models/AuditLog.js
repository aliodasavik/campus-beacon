const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  eventType: { type: String, required: true, trim: true, index: true },
  actorEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  targetType: {
    type: String,
    enum: ['Item', 'Claim', 'Notification', 'User', 'SavedSearch', 'Archive', 'System', 'Report', 'Chat'],
    default: 'System',
    index: true
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null, index: true },
  claimId: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', default: null, index: true },
  message: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' }
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.pre('save', function preventManualUpdate(next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are append-only and cannot be modified.'));
  }
  return next();
});

function blockMutation(next) {
  next(new Error('Audit logs are append-only and cannot be updated or deleted.'));
}

auditLogSchema.pre('updateOne', blockMutation);
auditLogSchema.pre('updateMany', blockMutation);
auditLogSchema.pre('findOneAndUpdate', blockMutation);
auditLogSchema.pre('deleteOne', blockMutation);
auditLogSchema.pre('deleteMany', blockMutation);
auditLogSchema.pre('findOneAndDelete', blockMutation);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
