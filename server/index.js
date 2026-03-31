const express = require('express')
const fsSync = require('fs')
const path = require('path')
const cors = require('cors')
const movieController = require('./controllers/movieController')

const app = express()

app.use(cors())
app.use(express.json())

const MOVIES_DIR = path.join(__dirname, '..', 'downloads')

app.get('/api/movies', async (req, res) => {
  try {
    const moviesWithPosters = await movieController.getMovies(MOVIES_DIR)
    res.json(moviesWithPosters);
  } catch (err) {
    console.error('Global Error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.get('/api/video/:filename', (req, res) => {
  const fileName = req.params.filename
  const videoPath = path.join(MOVIES_DIR, fileName)

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
})

app.listen(process.env.PORT, () => {
  console.log(`server run on port: ${process.env.PORT}`)
})