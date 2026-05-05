const express = require('express');
const router = express.Router();
const verifyEmail = require('../middleware/verifyEmail');
const isAdmin = require('../middleware/isAdmin');
const controller = require('../controllers/auditController');

router.get('/', verifyEmail, isAdmin, controller.listAuditLogs);
router.post('/', verifyEmail, controller.createAuditEntry);
router.get('/items/:itemId', verifyEmail, controller.getItemAuditTrail);
router.get('/claims/:claimId', verifyEmail, controller.getClaimAuditTrail);

module.exports = router;
