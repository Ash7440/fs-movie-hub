const Movie = require('../models/movie')
const logger = require('../utils/logger')
const movieHelper = require('../utils/movieHelper')
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

const createMovie = async (fileNameWithExt, pureName) => {
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

module.exports = {
  updateStatus,
  createMovie,
}