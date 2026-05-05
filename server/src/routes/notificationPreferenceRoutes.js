const express = require('express');
const router = express.Router();
const verifyEmail = require('../middleware/verifyEmail');
const controller = require('../controllers/notificationPreferenceController');

router.get('/', verifyEmail, controller.getMyPreferences);
router.put('/', verifyEmail, controller.updateMyPreferences);
router.post('/test', verifyEmail, controller.sendTestNotification);
router.get('/logs', verifyEmail, controller.getMyDeliveryLogs);
router.post('/logs/retry-failed', verifyEmail, controller.retryMyFailedDeliveries);
router.post('/logs/:id/retry', verifyEmail, controller.retryOneDelivery);

module.exports = router;
