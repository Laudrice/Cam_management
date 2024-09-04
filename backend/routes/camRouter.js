const camController = require('../controllers/camController.js')

const router = require('express').Router()

// router.post('/addCam', camController.addCam)

router.get('/allCams', camController.getAllCams)

router.get('/:id', camController.getOneCam)

router.put('/:id', camController.updateCam)

router.delete('/:id', camController.deleteCam)

// Routes de streaming
router.get('/stream/low/:channelId', camController.streamLowQuality);
router.get('/stream/high/:channelId', camController.streamHighQuality);

module.exports = router