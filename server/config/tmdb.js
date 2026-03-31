const HttpsProxyAgent = require('https-proxy-agent')
require('dotenv').config()

const tmdbConfig = () => {
  const agent = new HttpsProxyAgent('http://127.0.0.1:8080')

  const config = {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${process.env.TMDB_TOKEN}`
    },
    agent: agent,
  }

  return config
}

module.exports = tmdbConfig