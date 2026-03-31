const fs = require('fs').promises
require('dotenv').config()
const fsSync = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const movieHelper = require('../utils/movieHelper')
const tmdbConfig = require('../config/tmdb')
const Movie = require('../models/movie')

const moviesDir = path.join(process.cwd(), '..', process.env.MOVIES_DIR || 'downloads')

const getMovies = async (req, res) => {
  try {
    const allFiles = await fs.readdir(moviesDir)

    // 1. Сначала фильтруем только видео
    const videoFiles = allFiles.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.mp4', '.mkv', '.avi', '.mov'].includes(ext)
    })

    // 2. Обрабатываем каждый файл
    const moviesWithData = await Promise.all(videoFiles.map(async (file) => {
      try {
        let movie = await Movie.findOne({ fileName: file })

        // Если фильма нет в базе — идем в TMDB
        if (!movie) {
          console.log(`New movie found: ${file}. Fetching metadata...`)
          const query = movieHelper.cleanMovieName(file)
          
          const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`, 
            tmdbConfig()
          )

          if (!response.ok) throw new Error('TMDB_FETCH_FAILED')

          const arrMovies = await response.json()
          const data = arrMovies?.results?.[0]

          // Создаем новую запись (только если данные найдены, иначе ставим заглушки)
          movie = new Movie({
            fileName: file,
            title: data?.title || query,
            tmdbId: data?.id || null,
            posterPath: data?.poster_path || null,
            overview: data?.overview || 'Описание отсутствует',
            releaseDate: data?.release_date || null
          })

          await movie.save()
        }

        return movie
      } catch (fileErr) {
        console.error(`Error processing file ${file}:`, fileErr.message)
        return { fileName: file, title: 'Error loading data', posterPath: null }
      }
    }))

    res.json(moviesWithData)
  } catch (err) {
    console.error('Global Error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

const streamVideo = (req, res) => {
  try {
    const fileName = req.params.filename
    const videoPath = path.join(moviesDir, fileName)
    
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
    console.error('Global Error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

module.exports = { getMovies, streamVideo }