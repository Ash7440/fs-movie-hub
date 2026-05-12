const router = require('express').Router()

const { getPlayback, postPlayback } = require('../controllers/playbackController')

router.get('/:userId/:movieId', getPlayback)
router.post('/', postPlayback)

module.exports = router