const express = require('express');
const router = express.Router();
const verifyEmail = require('../middleware/verifyEmail');
const isAdmin = require('../middleware/isAdmin');
const controller = require('../controllers/archiveController');

router.get('/', verifyEmail, isAdmin, controller.listArchives);
router.get('/items/:itemId', verifyEmail, controller.getArchiveState);
router.post('/items/:itemId/archive', verifyEmail, isAdmin, controller.archiveOneItem);
router.put('/items/:itemId/extend', verifyEmail, isAdmin, controller.extendItemRetention);
router.post('/run', verifyEmail, isAdmin, controller.runArchiveJob);

module.exports = router;
