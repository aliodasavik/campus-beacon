const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['Electronics','ID Cards','Keys','Clothing','Bags','Documents','Others'], required: true },
  status: { type: String, enum: ['Lost','Found','Claimed','Resolved'], default: 'Lost' },
  zone: { type: String, default: '' },
  sensitivity: { type: String, enum: ['Low','Medium','High'], default: 'Low' },
  postedByEmail: { type: String },
  
  // FR10: Blind Claim Verification
  bcvQuestion: { type: String, default: '' },
  
  createdAt: { type: Date, default: Date.now }
});

// FR7: Full Text Search Index
itemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Item', itemSchema);