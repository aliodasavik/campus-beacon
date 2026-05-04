const Claim = require('../models/Claim');
const Item = require('../models/Item');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');

exports.createClaim = async (req, res) => {
  try {
    const { itemId, answer } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.status !== 'Found') return res.status(400).json({ message: 'Item is not available for claiming' });
    if (item.postedByEmail === req.user.email) return res.status(400).json({ message: 'Cannot claim your own item' });

    if (item.sensitivity === 'High' && item.bcvQuestion && !answer) {
      return res.status(400).json({ message: 'An answer to the verification question is required.' });
    }

    const newClaim = {
      itemId: item._id,
      claimerEmail: req.user.email,
      history: [{ status: 'Pending', actorEmail: req.user.email }]
    };

    if (answer) {
      newClaim.bcvSubmission = answer;
    }

    const claim = new Claim(newClaim);
    await claim.save();

    let notificationMessage = `${req.user.email} has requested to claim your item: "${item.title}".`;
    if (item.sensitivity === 'High' && item.bcvQuestion) {
      notificationMessage = `A claim on your item "${item.title}" needs your review.\nQuestion: "${item.bcvQuestion}"\nSubmitted Answer: "${answer}"`;
    }

    await Notification.create({
      recipientEmail: item.postedByEmail,
      message: notificationMessage,
      claimId: claim._id,
      type: 'ClaimRequest'
    });

    res.status(201).json(claim);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    const claim = await Claim.findById(req.params.id).populate('itemId');
    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    const item = claim.itemId;
    if (item.postedByEmail !== req.user.email) {
      return res.status(403).json({ message: 'Only the item poster can manage this claim.' });
    }

    claim.status = status;
    claim.history.push({ status, actorEmail: req.user.email });
    await claim.save();

    if (status === 'Accepted') {
      item.status = 'Claimed';
      await item.save();

      const existingChat = await Chat.findOne({ claimId: claim._id });
      if (!existingChat) {
        await Chat.create({
          claimId: claim._id,
          itemId: item._id,
          finderEmail: item.postedByEmail,
          claimerEmail: claim.claimerEmail,
          messages: [
            {
              senderEmail: item.postedByEmail,
              text: 'Claim accepted. Use this anonymous chat to coordinate pickup.'
            }
          ]
        });
      }
    }

    await Notification.create({
      recipientEmail: claim.claimerEmail,
      message: `Your claim for "${item.title}" was ${status.toLowerCase()} by the finder.`,
      claimId: claim._id,
      type: 'ClaimUpdate'
    });

    res.json(claim);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};