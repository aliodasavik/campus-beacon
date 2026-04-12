const Chat = require('../models/Chat');
const Claim = require('../models/Claim');

exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [
        { finderEmail: req.user.email },
        { claimerEmail: req.user.email }
      ]
    }).sort({ createdAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const allowed =
      chat.finderEmail === req.user.email ||
      chat.claimerEmail === req.user.email;

    if (!allowed) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;

    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const allowed =
      chat.finderEmail === req.user.email ||
      chat.claimerEmail === req.user.email;

    if (!allowed) {
      return res.status(403).json({ message: 'Not authorized to message in this chat' });
    }

    if (chat.isLocked) {
      return res.status(400).json({ message: 'This chat is locked' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    chat.messages.push({
      senderEmail: req.user.email,
      text: text.trim()
    });

    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.lockChatForClaim = async (claimId) => {
  try {
    await Chat.findOneAndUpdate({ claimId }, { isLocked: true });
  } catch (err) {
    console.error('Error locking chat:', err.message);
  }
};