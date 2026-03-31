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
  overview: String,
  releaseDate: String,
  filePath: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
})

movieSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Movie', movieSchema)