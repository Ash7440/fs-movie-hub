const router = require('express').Router()

const { getPlayback, postPlayback, getUserAllPlaybacks } = require('../controllers/playbackController')
const authMiddleware = require('../utils/auth')

router.get('/user', authMiddleware, getUserAllPlaybacks)
router.get('/:movieId', authMiddleware, getPlayback)
router.post('/', authMiddleware, postPlayback)

module.exports = router