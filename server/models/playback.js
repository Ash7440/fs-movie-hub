const mongoose = require('mongoose')

const playbackSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: true
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  timing: {
    type: Number,
    default: 0
  },
  isFinished: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now()
  }
})

playbackSchema.index({ username: 1, movieId: 1 }, { unique: true })

playbackSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Playback', playbackSchema)