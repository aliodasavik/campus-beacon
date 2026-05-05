const express = require('express');
const router = express.Router();
const verifyEmail = require('../middleware/verifyEmail');
const controller = require('../controllers/savedSearchController');

router.get('/', verifyEmail, controller.listMySavedSearches);
router.post('/', verifyEmail, controller.createSavedSearch);
router.put('/:id', verifyEmail, controller.updateSavedSearch);
router.delete('/:id', verifyEmail, controller.deleteSavedSearch);
router.get('/:id/matches', verifyEmail, controller.previewMatches);
router.post('/scan-alerts', verifyEmail, controller.runMyAlertScan);

module.exports = router;
