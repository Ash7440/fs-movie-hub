const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { avataaars } = require('@dicebear/collection')
const { createAvatar } = require('@dicebear/core')
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
      const userObj = user.toJSON()
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
    let passwordHash = null

    if (password && password.trim() !== '') {
      const saltRounds = 10
      passwordHash = await bcrypt.hash(password, saltRounds)
    }

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

const createToken = async (username, password) => {
  try {
    const user = await User.findOne({ username })

    if (user.passwordHash) {
      const match = await bcrypt.compare(password, user.passwordHash)
      if (!match) {
        return { error: 'Invalid password' }
      }
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username},
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    return ({
      token,
      user: { id: user._id, username: user.username, avatarPath: `/avatars/${user.avatar}` }
    })
  } catch (err) {
    throw err
  }
}

module.exports = {
  fetchUsers,
  createUser,
  createToken
}