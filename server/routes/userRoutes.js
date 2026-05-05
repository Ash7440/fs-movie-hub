const router = require('express').Router()
const { registerUser, getUsers } = require('../controllers/userController')

router.get('/', getUsers)
router.post('/', registerUser)

module.exports = router