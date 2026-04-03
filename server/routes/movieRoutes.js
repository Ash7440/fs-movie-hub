const router = require('express').Router()
const movieController = require('../controllers/movieController')

router.get('/', movieController.getMovies)
router.get('/status', movieController.getStatus)
router.get('/:filename', movieController.streamVideo)

module.exports = router