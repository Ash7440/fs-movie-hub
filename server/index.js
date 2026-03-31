const express = require('express')
const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')
const cors = require('cors')
const fetch = require('node-fetch')
const HttpsProxyAgent = require('https-proxy-agent')
require('dotenv').config()
const movieHelper = require('./utils/movieHelper')

const app = express()

app.use(cors())
app.use(express.json())

const MOVIES_DIR = path.join(__dirname, '..', 'downloads')

app.get('/api/movies', async (req, res) => {
  try {
    const files = await fs.readdir(MOVIES_DIR); // Теперь это можно "ждать"
    
    const videoFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.mp4', '.mkv', '.avi', '.mov'].includes(ext)
    })
    
    const moviesWithPosters = await Promise.all(
      videoFiles.map(async (file) => {
        const query = movieHelper.cleanMovieName(file)

        console.log('Final Query:', query)
        
        try {
          const agent = new HttpsProxyAgent('http://127.0.0.1:8080')
          const encodedQuery = encodeURIComponent(query)
          const url = `https://api.themoviedb.org/3/search/movie?query=${encodedQuery}&include_adult=true&language=en-US&page=1`
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${process.env.TMDB_TOKEN}`
            },
            agent: agent,
          })

          if (!response.ok) {
            // Если здесь ошибка, мы увидим её в консоли
            console.log(`TMDB Error Status: ${response.status} for file: ${file}`)
            throw new Error('TMDB_FETCH_FAILED')
          }

          const arrMovies = await response.json()
          const data = arrMovies?.results?.[0] || null

          return {
            name: file,
            title: query,
            poster: data ? `https://image.tmdb.org/t/p/w200${data.poster_path}` : null,
            overview: data ? data.overview : 'Описание отсутствует'
          };
        } catch (apiErr) {
          console.error(`Ошибка API для файла ${file}:`, apiErr.message)
          return { name: file, poster: null }
        }
      })
    );

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