const { createUser, fetchUsers, createToken } = require("../services/userService")
const logger = require("../utils/logger")

const getUsers = async (req, res) => {
  try {
    const users = await fetchUsers()

    if (!users) return res.status(404).json({ error: 'Can not find any users'})

    res.status(200).json(users)
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch users'})
    logger.error('Failed to fetch users: %s', err.message, {
      stack: err.stack,
      service: 'userController/getUsers'
    })
  }
}

const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username) return res.status(400).json({ error: 'Username is required' })
      
    const user = await createUser(username, password)

    res.status(201).json(user)
  } catch (err) {
    res.status(500).json({ error: `Failed to register new user: ${err}` })
    logger.error('Failed to register new user: %s', err.message, {
      stack: err.stack,
      service: 'userController/registerUser'
    })
  }
}

const loginUser = async (req, res) => {
  try {
    const { userId, password } = req.body
    const { token, user } = await createToken(userId, password)

    if (!token || !user) return res.status(401).json({ error: 'Failed to login' })

    res.status(200).json({
      token,
      user
    })
  } catch (err) {
    res.status(500).json({ error: 'Login failed' })
    logger.error('Login failed: %s', err.message, {
      stack: err.stack,
      service: 'userController/loginUser'
    })
  }
}

module.exports = {
  getUsers,
  registerUser,
  loginUser
}