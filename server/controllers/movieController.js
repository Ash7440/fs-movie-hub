const fs = require('fs').promises
require('dotenv').config()
const fsSync = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const HttpsProxyAgent = require('https-proxy-agent')
const movieHelper = require('../utils/movieHelper')

const getMovies = async (MOVIES_DIR) => {
  
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
        }
      } catch (apiErr) {
        console.error(`Ошибка API для файла ${file}:`, apiErr.message)
        return { name: file, poster: null }
      }
    })
  )

  return moviesWithPosters
}

module.exports = { getMovies }