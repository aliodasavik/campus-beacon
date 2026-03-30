// Server/models/Claim.js
const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  claimerEmail: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'Rejected'], 
    default: 'Pending' 
  },
  // --- NEW: Field to store the claimer's answer for the finder to review ---
  bcvSubmission: { type: String, default: '' },
  
  // Optional but recommended for FR9 audibility
  history: [
    {
      status: { type: String, required: true },
      actorEmail: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Claim', claimSchema);