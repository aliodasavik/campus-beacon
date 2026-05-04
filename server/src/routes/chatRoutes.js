const express = require('express');
const router = express.Router();

const verifyEmail = require('../middleware/verifyEmail');
const chatController = require('../controllers/chatController');

router.get('/', verifyEmail, chatController.getMyChats);
router.get('/:id', verifyEmail, chatController.getChatById);
router.post('/:id/messages', verifyEmail, chatController.sendMessage);

module.exports = router;