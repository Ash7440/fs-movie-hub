const path = require('path')
const fs = require('fs').promises

const Movie = require('../models/movie')
const logger = require('../utils/logger')
const movieHelper = require('../utils/movieHelper')
const { moviesDir, outputDir } = require('../config/constants')
const fetchTmdb = require('./tmdbService')
const downloadPoster = require('../utils/downloadPoster')

const updateStatus = async (fullName, status) => {
  try {
    await Movie.findOneAndUpdate(
      { fileName: fullName }, // Ищем по имени
      { status: status }                 
    )
    logger.info('Статус в БД обновлен: %s', fullName)
  } catch (err) {
    logger.error('Ошибка обновления БД: %s', err.message, { stack: err.stack })
  }
}

const createMovie = async (fileNameWithExt, pureName, duration) => {
  try {
    let movie = await Movie.findOne({ fileName: fileNameWithExt })
    
    if (!movie) {
      logger.info('Создание записи в БД для: %s', pureName)
      const query = movieHelper.cleanMovieName(fileNameWithExt)
      const data = await fetchTmdb(query)
      const localPoster = await downloadPoster(data?.poster_path || null)

      movie = new Movie({
        fileName: fileNameWithExt,
        title: data?.title || query,
        tmdbId: data?.id || null,
        posterPath: data?.poster_path || null,
        localPosterPath: localPoster || null,
        overview: data?.overview || 'Описание отсутствует',
        releaseDate: data?.release_date || null,
        duration: duration || 0,
        status: 'processing'
      })

      await movie.save()
      logger.info('Запись создана: %s', movie.title)
    }

    return movie
  } catch (err) {
    logger.error('Failed to create movie id db: %s', err.message, {
      service: 'movieService/createMovie',
      stack: err.stack
    })
    throw err
  }
}

const deleteMovie = async (movieId) => {
  try {
    const movie = await Movie.findById(movieId)

    const pureName = path.basename(movie.fileName, path.extname(movie.fileName))

    if (!movie) throw new Error('Movie not found')

    if (movie.status === 'processing') throw new Error('Error, movie in process now')

    const filesToDelete = [
      // path.join(moviesDir, movie.fileName),
      path.join(outputDir, `${pureName}.mp4`),
      movie.localPosterPath ? path.join(moviesDir, movie.localPosterPath) : null
    ].filter(Boolean)

    for (const filePath of filesToDelete) {
      try {
        await fs.access(filePath)
        await fs.unlink(filePath)
        logger.info('Movie deleted: %s', filePath)
      } catch (err) {
        logger.error('File not found, or has already been deleted: %s', err.message, {
          filePath,
          stack: err.stack,
          service: 'movieService/deleteMoie'
        })
      }
    }

    await Movie.findByIdAndUpdate(movieId, { 
      status: 'deleted',
      addedAt: Date.now() 
    })

    return { success: true }
  } catch (err) {
    logger.error('Failed to delete movie: %s', err.message, {
      stack: err.stack,
      service: 'movieService/deleteMovie'
    })
    throw err
  }
}

const deleteSourceMovie = async (filename) => {
  const filePath = path.join(moviesDir, filename)

  try {
    await fs.access(filePath)
    await fs.unlink(filePath)
    logger.info('Source file was successfully deleted: %s', filePath)
  } catch (err) {
    logger.error('Source file not found, or has already been deleted: %s', err, {
      stack: err.stack,
      service: 'movieService/deleteSourceMovie'
    })
    throw err
  }
}

module.exports = {
  updateStatus,
  createMovie,
  deleteMovie,
  deleteSourceMovie
}