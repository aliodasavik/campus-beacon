const express = require('express');
const router = express.Router();

router.use('/notification-preferences', require('./notificationPreferenceRoutes'));
router.use('/locations', require('./locationRoutes'));
router.use('/audit', require('./auditRoutes'));
router.use('/saved-searches', require('./savedSearchRoutes'));
router.use('/archive', require('./archiveRoutes'));

module.exports = router;
