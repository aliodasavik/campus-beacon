const express = require('express');
const router = express.Router();
const verifyEmail = require('../middleware/verifyEmail');
const controller = require('../controllers/itemController');

router.post('/', verifyEmail, controller.createItem);
router.get('/', verifyEmail, controller.listItems);
router.put('/:id/status', verifyEmail, controller.updateStatus);
router.put('/:id/sos', verifyEmail, controller.triggerSOS);
router.get('/:id/matches', verifyEmail, controller.findIdCardMatches);

module.exports = router;