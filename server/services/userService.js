const bcrypt = require('bcrypt')
const { createAvatar } = require('@dicebear/core')
const { avataaars } = require('@dicebear/collection')
const fs = require('fs').promises
const path = require('path')

const User = require('../models/user')
const logger = require('../utils/logger')

const generateAvatar = async (username) => {
  const avatar = createAvatar(avataaars, {
    seed: username,
    width: 128,
    height: 128
  })

  const svg = avatar.toString()
  const fileName = `${username}_avatar.svg`
  const filePath = path.join(__dirname, '../../downloads/avatars', fileName)

  await fs.writeFile(filePath, svg)

  return fileName
}

const fetchUsers = async () => {
  try {
    const users = await User.find()

    const usersWithAvatars = users.map(user => {
      const userObj = user.toObject()
      userObj.avatarPath = `/avatars/${user.avatar}`

      return userObj
    })

    return usersWithAvatars
  } catch (err) {
    logger.error('Failed to load users: %s', err.message, {
      stack: err.stack,
      service: 'userService/fetchUsers'
    })
    throw err
  }
}

const createUser = async (username, password) => {
  try {
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const avatar = await generateAvatar(username)
    
    const user = new User({
      username: username,
      passwordHash: passwordHash,
      avatar: avatar
    })
    
    await user.save()
    logger.info('User "%s" have been created', username)

    return user
  } catch (err) {
    logger.error('Failed to create user: %s', err.message, {
      stack: err.stack,
      service: 'userService/createUser'
    })
    throw err
  }
}

module.exports = {
  fetchUsers,
  createUser
}