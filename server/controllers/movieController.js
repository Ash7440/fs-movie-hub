require('dotenv').config()
const fsSync = require('fs')
const path = require('path')

const Movie = require('../models/movie')
const conversionEvents = require('../utils/events')

const convertedDir = path.join(process.cwd(), '..', process.env.CONVERTED_DIR || 'downloads/converted')

const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ addedAt: -1 })

    const moviesWithData = movies.map(movie => {
      const movieObj = movie.toObject({ virtuals: true })
      
      // Берем fileName из базы (например 'Film.mkv'), отрезаем расширение и добавляем .mp4
      const pureName = path.basename(movie.fileName, path.extname(movie.fileName))
      movieObj.playFile = `${pureName}.mp4`

      return movieObj
    })

    res.json(moviesWithData)
  } catch (err) {
    logger.error('Global Error: %s', err, {
      service: 'movieController/getMovies',
      stack: err.stack
    })
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

const streamVideo = (req, res) => {
  try {
    const fileName = req.params.filename
    const videoPath = path.join(convertedDir, fileName)
    
    if (!fsSync.existsSync(videoPath)) {
      return res.status(404).send('film not found')
    }
    
    const stat = fsSync.statSync(videoPath)
    const fileSize = stat.size
    const range = req.headers.range
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

      if (start >= fileSize) {
        res.status(406).send('value is out of range')
        return
      }

      const chunksize = (end - start) + 1
      const file = fsSync.createReadStream(videoPath, { start, end })

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      }

      res.writeHead(206, head)
      file.pipe(res)
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
      }
      res.writeHead(200, head)
      fsSync.createReadStream(videoPath).pipe(res)
    }
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

module.exports = { getMovies, streamVideo, getStatus }