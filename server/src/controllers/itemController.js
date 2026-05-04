const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');

exports.createItem = async (req, res) => {
  try {
    const { bcvAnswer, ...itemData } = req.body;
    let bcvAnswerHash = '';

    if (bcvAnswer && itemData.sensitivity === 'High') {
      const salt = await bcrypt.genSalt(10);
      bcvAnswerHash = await bcrypt.hash(bcvAnswer.toLowerCase().trim(), salt);
    }

    const item = new Item({
      ...itemData,
      bcvAnswerHash,
      postedByEmail: req.user.email
    });

    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listItems = async (req, res) => {
  try {
    await Item.ensureIndexes();

    const { q, category, status, sort } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    if (q) {
      filter.$text = { $search: q };
    }

    let query = Item.find(filter);

    if (q) {
      query = query.sort({ score: { $meta: 'textScore' } });
    } else if (sort === 'oldest') {
      query = query.sort('createdAt');
    } else {
      query = query.sort('-createdAt');
    }

    const items = await query.select('-bcvAnswerHash').exec();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.postedByEmail !== req.user.email) return res.status(403).json({ message: 'Not authorized' });

    item.status = req.body.status;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.triggerSOS = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.postedByEmail !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (item.status !== 'Lost') {
      return res.status(400).json({ message: 'SOS can only be triggered for lost items' });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.sosUsed) {
      return res.status(400).json({ message: 'You have already used your SOS broadcast' });
    }

    item.isSOS = true;
    await item.save();

    user.sosUsed = true;
    await user.save();

    const recipients = await User.find({
      isVerified: true,
      email: { $ne: req.user.email }
    });

    const notifications = recipients.map(u => ({
      recipientEmail: u.email,
      message: `🚨 SOS ALERT: "${item.title}" was reported lost in ${item.zone || 'an unknown area'}. Please check the feed for details.`,
      type: 'Alert'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({
      message: 'SOS broadcast sent successfully',
      item
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.findIdCardMatches = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.category !== 'ID Cards') {
      return res.status(400).json({ message: 'Matching is only available for ID Cards' });
    }

    const oppositeStatus = item.status === 'Lost' ? 'Found' : 'Lost';

    const matchFilter = {
      _id: { $ne: item._id },
      category: 'ID Cards',
      status: oppositeStatus
    };

    const possibleMatches = await Item.find(matchFilter).select('-bcvAnswerHash');

    const normalizedHolderName = (item.holderName || '').trim().toLowerCase();
    const normalizedIdNumber = (item.idNumber || '').trim().toLowerCase();
    const normalizedCardType = (item.cardType || '').trim().toLowerCase();

    const scoredMatches = possibleMatches
      .map(candidate => {
        let score = 0;

        if ((candidate.cardType || '').trim().toLowerCase() === normalizedCardType && normalizedCardType) {
          score += 3;
        }

        if ((candidate.holderName || '').trim().toLowerCase() === normalizedHolderName && normalizedHolderName) {
          score += 5;
        }

        if ((candidate.idNumber || '').trim().toLowerCase() === normalizedIdNumber && normalizedIdNumber) {
          score += 7;
        }

        return { ...candidate.toObject(), matchScore: score };
      })
      .filter(match => match.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore || new Date(b.createdAt) - new Date(a.createdAt));

    res.json(scoredMatches);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};