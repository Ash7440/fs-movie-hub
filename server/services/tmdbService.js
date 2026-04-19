const { tmdbConfig } = require('../config/tmdb')
const fetch = require('node-fetch')

const fetchTmdb = async (query) => {

  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=ru-RU&page=1`, 
    tmdbConfig()
  )

  if (!response.ok) {
    throw new Error('Failed to fetch tmdb')
  }

  const arrMovies = await response.json()
  const data = arrMovies?.results?.[0]

  return data
}

module.exports = fetchTmdb