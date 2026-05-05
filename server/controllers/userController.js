const { createUser } = require("../services/userService")
const logger = require("../utils/logger")

const register = async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username) return res.status(400).json({ error: 'Username and password are required' })
      
    const user = await createUser(username, password)

    res.status(201).json(user)
  } catch (err) {
    res.status(500).json({ error: `Failed to register new user: ${err}` })
    logger.error('Failed to register new user: %s', err.message, {
      stack: err.stack,
      service: 'userController/register'
    })
  }
}

module.exports = {
  register
}