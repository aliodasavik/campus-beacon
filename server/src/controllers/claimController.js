const Claim = require('../models/Claim');
const Item = require('../models/Item');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');

exports.createClaim = async (req, res) => {
  try {
    const item = await Item.findById(req.body.itemId);
    if (!item || item.status !== 'Found') return res.status(400).json({ message: 'Invalid item' });
    if (item.postedByEmail === req.user.email) return res.status(400).json({ message: 'Cannot claim your own item' });

    const claim = new Claim({ itemId: item._id, claimerEmail: req.user.email });
    await claim.save();
    
    // FR8: Trigger Notification to the Poster (Finder)
    await Notification.create({
      recipientEmail: item.postedByEmail,
      message: `${req.user.email} has requested to claim your item: ${item.title}`,
      claimId: claim._id,
      type: 'ClaimRequest'
    });
    
    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyBCV = async (req, res) => {
  try {
    const { claimId, answer } = req.body;
    const claim = await Claim.findById(claimId);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    const item = await Item.findById(claim.itemId);

    const isMatch = await bcrypt.compare(answer.toLowerCase().trim(), item.bcvAnswerHash);
    
    if (isMatch) {
      claim.status = 'Verified';
      await claim.save();

      // FR9: Notify Poster that BCV was passed
      await Notification.create({
        recipientEmail: item.postedByEmail,
        message: `${claim.claimerEmail} successfully answered the security question for: ${item.title}`,
        claimId: claim._id,
        type: 'ClaimRequest'
      });

      res.json({ success: true, message: 'Verification passed!', claim });
    } else {
      claim.status = 'Failed Verification';
      await claim.save();
      res.status(400).json({ success: false, message: 'Incorrect answer.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// FR9: New Function so the Poster can Accept or Reject the claim
exports.updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'Accepted' or 'Rejected'
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    const item = await Item.findById(claim.itemId);
    if (item.postedByEmail !== req.user.email) return res.status(403).json({ message: 'Only the poster can approve this' });

    claim.status = status;
    await claim.save();

    if (status === 'Accepted') {
      item.status = 'Claimed'; // Update item status when accepted
      await item.save();
    }

    // FR9: Notify the Claimer about the decision
    await Notification.create({
      recipientEmail: claim.claimerEmail,
      message: `Your claim for ${item.title} was ${status} by the poster.`,
      claimId: claim._id,
      type: 'ClaimUpdate'
    });

    res.json(claim);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};