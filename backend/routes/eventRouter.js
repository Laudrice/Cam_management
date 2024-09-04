const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/allEvents', eventController.getEventList);
router.get('/videos/:eventId', eventController.getEventVideos);

module.exports = router;
