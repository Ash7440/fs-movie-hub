const bcrypt = require('bcrypt')

const User = require('../models/user')
const logger = require('../utils/logger')

const createUser = async (username, password) => {
  try {
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    
    const user = new User({
      username: username,
      passwordHash: passwordHash
    })
    
    await user.save()
    logger.info('User "%s" have been created', username)
  } catch (err) {
    logger.error('Failed to create user: %s', err.message, {
      stack: err.stack,
      service: 'userService/createUser'
    })
    throw err
  }
}

module.exports = {
  createUser
}