const router = require('express').Router()
const { registerUser, getUsers, loginUser } = require('../controllers/userController')

router.get('/', getUsers)
router.post('/', registerUser)
router.post('/login', loginUser)

module.exports = router