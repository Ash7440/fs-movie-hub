const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const movieRoutes = require('./routes/movieRoutes')

const app = express()

app.use(cors())

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('mongodb connected!')
  })
  .catch(() => {
    console.log('failed to connect to db')
  })

app.use(express.json())

app.use('/api/movies', movieRoutes)

require('./utils/converter')

app.listen(process.env.PORT, () => {
  console.log(`server run on port: ${process.env.PORT}`)
})