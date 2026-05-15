const router = require('express').Router()

const { getPlayback, postPlayback, getUserAllPlaybacks } = require('../controllers/playbackController')

router.get('/user/:userId', getUserAllPlaybacks)
router.get('/:userId/:movieId', getPlayback)
router.post('/', postPlayback)

module.exports = router