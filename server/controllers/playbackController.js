const { fetchPlayback, createPlayback } = require("../services/playbackService")
const logger = require("../utils/logger")

const getPlayback = async (req, res) => {
  try {
    const userId = req.params.userId
    const movieId = req.params.movieId

    const playback = await fetchPlayback(userId, movieId)
    if (!playback) return res.status(404).json({ error: 'Failed to get playback' })

    res.status(200).json(playback)
  } catch (err) {
    res.status(500).json({ error: 'Failed to get playback' })
    logger.error('Failed to get playback: %s', err.message, {
      stack: err.stack,
      service: 'playbackController/getPlayback'
    })
  }
}

const postPlayback = async (req, res) => {
  try {
    const { userId, movieId, timing } = req.body
    if (!userId && !movieId && timing) return res.status(400).json({ error: 'Failed to create playback' })

    const playback = await createPlayback(userId, movieId, timing)
    if (!playback) return res.status(400).json({ error: 'Failed to create playback' })

    res.status(201).json(playback)
  } catch (err) {
    res.status(500).json({ error: 'Failed to creae playback' })
    logger.error('Failed to create playback: %s', err.message, {
      stack: err.stack,
      service: 'playbackController/postPlayback'
    })
  }
}

module.exports = {
  getPlayback,
  postPlayback
}