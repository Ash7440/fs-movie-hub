const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config()

const movieRoutes = require('./routes/movieRoutes')
const logger = require('./utils/logger')

const app = express()

app.use(cors())

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('mongodb connected!')
  })
  .catch(() => {
    logger.error('failed to connect to db')
  })

app.use(express.json())
app.use(morgan('dev'))

app.use('/api/movies', movieRoutes)

require('./utils/converter')

app.use(express.static(path.join(__dirname, 'dist')))
app.use('/posters', express.static(path.join(__dirname, '..', 'downloads', 'posters')))

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
})

app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log(`server run on port: ${process.env.PORT}`)
})