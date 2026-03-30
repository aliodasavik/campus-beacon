
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken'); // <-- 1. Import middleware

router.post('/signup', authController.signup);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login', authController.login);

// 2. Add the update route, protected by verifyToken
router.put('/update', verifyToken, authController.updateProfile);

module.exports = router;
// Add this at the bottom (make sure verifyToken is imported at the top!)
router.delete('/delete', verifyToken, authController.deleteAccount);