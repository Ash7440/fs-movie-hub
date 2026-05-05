const router = require('express').Router()
const { register } = require('../controllers/userController')

router.post('/', register)

module.exports = router