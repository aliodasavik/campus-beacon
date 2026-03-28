const Item = require('../models/Item');
const bcrypt = require('bcryptjs');

exports.createItem = async (req, res) => {
  try {
    const { bcvAnswer, ...itemData } = req.body;
    let bcvAnswerHash = '';

    // FR10: Securely hash the answer if provided
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
    // Manually ensure the index exists every time (good for debugging)
    await Item.ensureIndexes(); 

    const { q, category, status, sort } = req.query;
    const filter = {};
    
    // --- DEBUG LOG 1 ---
    console.log(`[DEBUG] Received Request Query:`, req.query);

    if (category) filter.category = category;
    if (status) filter.status = status;

    if (q) {
      filter.$text = { $search: q };
    }

    // --- DEBUG LOG 2 ---
    console.log(`[DEBUG] Constructed MongoDB Filter:`, filter);

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
    // --- DEBUG LOG 3 ---
    console.error("[ERROR] during listItems:", err); 
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