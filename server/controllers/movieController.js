require('dotenv').config()
const fsSync = require('fs')
const fsPromises = require('fs').promises
const path = require('path')

const Movie = require('../models/movie')
const conversionEvents = require('../utils/events')
const { fetchMovies, deleteMovie } = require('../services/movieService')
const logger = require('../utils/logger')

const convertedDir = path.join(process.cwd(), '..', process.env.CONVERTED_DIR || 'downloads/converted')

const getMovies = async (req, res) => {
  try {
    const { userId } = req.query
    const movies = await fetchMovies(userId)

    if (!movies) return res.status(404).json({ error: 'No movies found'})

    res.json(movies)
  } catch (err) {
    logger.error('Global Error: %s', err, {
      service: 'movieController/getMovies',
      stack: err.stack
    })
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

const streamVideo = async (req, res) => {
  try {
    const folderName = req.params.folderName
    const fileName = req.params.fileName
    const filePath = path.join(convertedDir, folderName, fileName)
    
    try {
      await fsPromises.access(filePath, fsSync.constants.F_OK)
    } catch (err) {
      return res.status(404).send('File not found')
    }

    const ext = path.extname(fileName)
    if (ext === '.m3u8') {
      res.setHeader('Content-Type', 'application/x-mpegURL')
      res.setHeader('Cache-Control', 'no-cache')
    } else if (ext === '.ts') {
      res.setHeader('Content-Type', 'video/mp2t')
      res.setHeader('Cache-Control', 'public, max-age=3600')
    }
    
    res.status(200)
    fsSync.createReadStream(filePath).pipe(res)
    
  } catch (err) {
    logger.error('Global Error: %s', err, {
      service: 'movieController/streamVideo',
      stack: err.stack
    })
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

const getStatus = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Content-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  res.write('data: {"connected":true}\n\n')

  const onProgress = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  conversionEvents.on('progress', onProgress)

  req.on('close', () => {
    conversionEvents.removeListener('progress', onProgress)
    res.end()
  })
}

const removeMovie = async (req, res) => {
  try {
    const movieId = req.params.id

    await deleteMovie(movieId)
    res.status(204).end()
  } catch (err) {
    logger.error('Failed to remove movie: %s', err.message, {
      stack: err.stack,
      service: 'movieController/removeMovie'
    })
    res.status(404).json({ error: 'Failed to delete movie' })
  }
}

module.exports = { getMovies, streamVideo, getStatus, removeMovie }