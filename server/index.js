const express = require('express')
const cors = require('cors')
const movieRoutes = require('./routes/movieRoutes')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/movies', movieRoutes)

app.listen(process.env.PORT, () => {
  console.log(`server run on port: ${process.env.PORT}`)
})