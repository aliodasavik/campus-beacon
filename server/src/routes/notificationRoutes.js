const express = require('express');
const router = express.Router();
const verifyEmail = require('../middleware/verifyEmail');
const controller = require('../controllers/notificationController');

router.get('/', verifyEmail, controller.getNotifications);
router.put('/:id/read', verifyEmail, controller.markAsRead);

module.exports = router;