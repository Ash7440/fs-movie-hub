const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  tmdbId: Number,
  posterPath: String,
  localPosterPath: String,
  overview: String,
  releaseDate: String,
  duration: Number,
  status: {
    type: String,
    default: null
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
})

movieSchema.virtual('fullPosterUrl').get(function() {
  if (!this.posterPath) return null

  const size = 'w500'
  return `http://image.tmdb.org/t/p/${size}${this.posterPath}`
})

movieSchema.set('toJSON', {
  virtuals: true,
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Movie', movieSchema)