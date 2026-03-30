const express = require('express');
const router = express.Router();
const verifyEmail = require('../middleware/verifyEmail');
const controller = require('../controllers/claimController');

// Route to create a new claim
router.post('/', verifyEmail, controller.createClaim);

// Route to update the claim status (Accept/Reject) - USING 'router', NOT 'app'
router.put('/:id/status', verifyEmail, controller.updateClaimStatus);

module.exports = router;