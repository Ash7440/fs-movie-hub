const Playback = require('../models/playback')
const logger = require('../utils/logger')

const getPlayback = async (userId, movieId) => {
  try {
    const playback = await Playback.findOne({
      userId: userId,
      movieId: movieId
    })
  } catch (err) {
    logger.error('No playback found: %s', err.message, {
      stack: err.stack,
      service: 'playbackServices/getPlayback'
    })
  }
}