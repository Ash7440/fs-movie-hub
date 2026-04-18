const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const { pipeline } = require('stream/promises')
const { agent } = require('../config/tmdb')

const downloadPoster = async (posterPath) => {
  if (!posterPath) {
    return null
  }

  const fileName = posterPath.replace('/', '')
  const folderPath = path.join(__dirname, '..', '..', 'downloads', 'posters')
  const filePath = path.join(folderPath, fileName)
  const publicUrl = `/posters/${fileName}`

  if (fs.existsSync(filePath)) {
    return publicUrl
  }

  const imageUrl = `https://image.tmdb.org/t/p/w500${posterPath}`

  try {
    const response = await fetch(imageUrl, {
      agent: agent,
      headers: {
        // Притворяемся браузером, чтобы CDN не выдал 404/403
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch poster: ${response.status} ${response.statusText}`)
    }

    const writer = fs.createWriteStream(filePath)

    await pipeline(response.body, writer)

    return publicUrl
  } catch (err) {
    console.error('Failed to download from node-fetch', err.message)
    return null
  }
}

module.exports = downloadPoster