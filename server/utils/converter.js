const chokidar = require('chokidar')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const fs = require('fs')

const logger = require('./logger')
const movieHelper = require('./movieHelper')
const conversionEvents = require('./events')
const Movie = require('../models/movie')
const downloadPoster = require('./downloadPoster')
const fetchTmdb = require('../services/tmdbService')

const moviesDir = path.resolve(__dirname, '../../downloads')
const outputDir = path.resolve(moviesDir, 'converted')

logger.info('Конвертер запущен', { moviesDir, outputDir })

const getMediaInfo = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err)
      else resolve(metadata)
    })
  })
}

// 2. Создаем папку с проверкой ошибок
try {
  if (!fs.existsSync(outputDir)) {
    logger.info('Попытка создать папку converted')
    fs.mkdirSync(outputDir, { recursive: true })
    logger.info('Папка создана успешно')
  } else {
    logger.info('Папка converted уже существует')
  }
} catch (err) {
  logger.error('Ошибка при создании папки:', { 
    foldername: outputDir,
    message: err.message,
    stack: err.stack
  })
}

let processingQueue = []
let isProcessing = false

const processNext = async () => {
  if (processingQueue.length === 0 || isProcessing) return
  isProcessing = true
  const { filePath, targetPath, fileName, fileExt } = processingQueue.shift()

  const fullName = fileName + fileExt

  const pureName = path.basename(fileName, path.extname(fileName))

  logger.info('Начата конвертация %s%s', fileName, fileExt)

  let videoCodecName = null

  try {
    const metadata = await getMediaInfo(filePath)
    const videoStream = metadata.streams.find(s => s.codec_type === 'video')

    if (videoStream) {
      videoCodecName = videoStream.codec_name
      logger.info('Обнаружен видеокодек: %s', videoCodecName)
    }
  } catch (err) {
    logger.error('Ошибка при чтении файла', {
      filename: fileName,
      message: err.message,
      stack: err.stack
    })
    isProcessing = false
    processNext()
    return
  }
  
  let command = ffmpeg(filePath)

  if ((fileExt === '.mkv' || fileExt === '.mp4') && videoCodecName === 'h264') {
    logger.info('Прямое копирование видеопотока')
    command
      .videoCodec('copy')
      .audioCodec('aac')
      .audioChannels(2)
      .audioBitrate('192k')
      .outputOptions('-movflags +faststart')
  } else {
    logger.info('Перекодирование видеопотока')
    command
      .videoCodec('h264_nvenc')
      .outputOptions([
        '-preset slow',
        '-profile:v high',
        '-rc vbr',
        '-cq 24',
        '-gpu 0',
        '-movflags +faststart'
      ])
      .audioCodec('aac')
      .audioChannels(2)
      .audioBitrate('192k')
  }

  command
    .output(targetPath)
    .on('start', async (cmd) => {
      logger.info('Команда FFmpeg: %s', cmd)

      try {
        await Movie.findOneAndUpdate(
          { fileName: fullName}, // Ищем по имени
          { status: 'processing' }                 
        )
        logger.info('Статус в БД обновлен: %s', pureName)
      } catch (err) {
        logger.error('Ошибка обновления БД: %s', err.message, { stack: err.stack })
      }
    })
    .on('progress', async (p) => {
      const percent = Math.round(p.percent || 0)
        conversionEvents.emit('progress', {
        fileName: pureName,
        percent: percent,
        status: 'processing'
      })

      process.stdout.write(`\rЛог: ${fileName} - ${percent}%`)

      if (percent % 25 === 0 && percent !== 0) {
        logger.info('Конвертация фильма %s: пройден этап %d%%', fileName, percent);
      }
    })
    .on('end', async () => {
      process.stdout.write('\n')
      conversionEvents.emit('progress', { 
        fileName: pureName, 
        percent: 100, 
        status: 'done' 
      })

      try {
        await Movie.findOneAndUpdate(
          { fileName: fullName },
          { status: 'ready' }
        )
        logger.info('Статус в БД обновлен %s', pureName)
      } catch (err) {
        logger.error('Ошибка обновления БД: %s', err.message, { stack: err.stack })
      }

      logger.info('Готово: %s.mp4', pureName)
      isProcessing = false
      processNext()
    })
    .on('error', async (err) => {

      conversionEvents.emit('progress', { 
        fileName: pureName, 
        status: 'error',
        message: err.message 
      })

      try {
        await Movie.findOneAndUpdate(
          { fileName: fullName },
          { status: 'error' }
        )
        logger.info('Статус в БД обновлен: %s', pureName)
      } catch (err) {
        logger.error('Ошибка обновления БД: %s', err.message, { stack: err.stack })
      }

      logger.error('Ошибка FFmpeg в файле %s: %s', fileName, err.message, { stack: err.stack })
      isProcessing = false
      processNext()
    })
    .run()
}

// 3. Настройка Watcher с расширенным логированием
const watcher = chokidar.watch(moviesDir.replace(/\\/g, '/'), {
  ignored: [
    '**/converted/**',
    /(^|[\/\\])\../
  ],
  persistent: true,
  ignoreInitial: false,
  usePolling: true,
  interval: 500,
  depth: 0,
  awaitWriteFinish: {
    stabilityThreshold: 5000,
    pollInterval: 500
  }
})

logger.info('Запуск сканирования...')

watcher.on('add', async (filePath) => {
  const fileExt = path.extname(filePath).toLowerCase()
  const fileNameWithExt = path.basename(filePath)
  const pureName = path.basename(filePath, fileExt)
  const targetPath = path.join(outputDir, `${pureName}.mp4`)

  const supportedExtensions = ['.mkv', '.avi', '.mov', '.wmv', '.mp4']
  if (!supportedExtensions.includes(fileExt)) return

  logger.info('Новый файл: %s', fileNameWithExt)

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

      conversionEvents.emit('progress', { 
        type: 'NEW_MOVIE_DETECTED',
        status: 'new' 
      })
    }

    // 2. ДОБАВЛЯЕМ В ОЧЕРЕДЬ КОНВЕРТАЦИИ
    if (!fs.existsSync(targetPath)) {
      logger.info('В очередь: %s', pureName)
      processingQueue.push({ filePath, targetPath, fileName: pureName, fileExt })
      processNext()
    } else {
      logger.info('Уже сконвертирован: %s', pureName)
      if (movie.status !== 'ready') {
        movie.status = 'ready'
        await movie.save()
      }
    }
  } catch (err) {
    logger.error('Ошибка Watcher (add): %s', err.message, {stack: err.stack})
  }
})

watcher.on('ready', () => {
  logger.info('Сканирование завершено. Ожидаю новые файлы...')
})

watcher.on('error', error => logger.error('Ошибка Watcher: %s', error.message, { stack: error.stack }))