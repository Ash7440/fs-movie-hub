const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

const app = express()

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

const PORT = 3001
app.listen(PORT, () => {
  console.log(`server run on port: ${PORT}`)
})