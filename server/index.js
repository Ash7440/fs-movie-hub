const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

const MOVIES_DIR = path.join(__dirname, '..', 'downloads')

app.get('/api/movies', (req, res) => {
  fs.readdir(MOVIES_DIR, (err, files) => {
    if (err) {
      console.error('Unable to read files', err)
      return res.status(500).json({ error: 'Unable to read files' })
    }

    const videoFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.mp4', '.mkv', '.avi', '.mov'].includes(ext)
    })

    res.json(videoFiles)
  })
})

app.get('/api/video/:filename', (req, res) => {
  const fileName = req.params.filename
  const videoPath = path.join(MOVIES_DIR, fileName)

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('film not found')
  }

  const stat = fs.statSync(videoPath)
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
    const file = fs.createReadStream(videoPath, { start, end })

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
    fs.createReadStream(videoPath).pipe(res)
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`server run on port: ${PORT}`)
})