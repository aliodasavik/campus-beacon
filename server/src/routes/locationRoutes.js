const express = require('express');
const router = express.Router();
const verifyEmail = require('../middleware/verifyEmail');
const isAdmin = require('../middleware/isAdmin');
const controller = require('../controllers/locationController');

router.get('/zones', verifyEmail, controller.listCampusZones);
router.post('/zones', verifyEmail, isAdmin, controller.createCampusZone);
router.get('/items', verifyEmail, controller.listItemsByLocation);
router.get('/items/:itemId', verifyEmail, controller.getItemLocation);
router.put('/items/:itemId', verifyEmail, controller.upsertItemLocation);

module.exports = router;
