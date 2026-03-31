const express = require('express')
const cors = require('cors')
const movieController = require('./controllers/movieController')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/movies', (req, res) => {
  movieController.getMovies(req, res)
})

app.get('/api/video/:filename', (req, res) => {
  movieController.streamVideo(req, res)
})

app.listen(process.env.PORT, () => {
  console.log(`server run on port: ${process.env.PORT}`)
})