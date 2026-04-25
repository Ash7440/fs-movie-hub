const router = require('express').Router()
const movieController = require('../controllers/movieController')

router.get('/', movieController.getMovies)
router.get('/status', movieController.getStatus)
router.get('/:filename', movieController.streamVideo)

router.delete('/:id', movieController.removeMovie)

module.exports = router