const Playback = require('../models/playback')
const Movie = require('../models/movie')
const logger = require('../utils/logger')

const fetchPlayback = async (userId, movieId) => {
  try {
    const playback = await Playback.findOne({
      userId: userId,
      movieId: movieId
    })

    return playback
  } catch (err) {
    logger.error('No playback found: %s', err.message, {
      stack: err.stack,
      service: 'playbackServices/getPlayback'
    })
  }
}

const createPlayback = async (userId, movieId, timing) => {
  try {
    const movie = await Movie.findById(movieId)
    if (!movie) throw new Error('Movie not found')

    const duration = movie.duration
    const progressPercent = (timing / duration) * 100

    if (progressPercent >= 95) {
      return await Playback.findOneAndUpdate({
        userId: userId,
        movieId: movieId
      },
      {
        timing: 0,
        isFinished: true,
        updatedAt: Date.now()
      },
      { upsert: true, new: true })
    }

    return await Playback.findOneAndUpdate({
      userId: userId,
      movieId: movieId
    },
    {
      timing: timing,
      isFinished: false,
      updatedAt: Date.now()
    },
    { upsert: true, new: true })
  } catch (err) {
    logger.error('Failed to create playback: %s', err.message, {
      stack: err.stack,
      service: 'playbackService/postPlayback'
    })
    throw err
  }
}

module.exports = {
  fetchPlayback,
  createPlayback
}