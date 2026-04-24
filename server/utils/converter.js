const chokidar = require('chokidar')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const fs = require('fs')

const logger = require('./logger')
const conversionEvents = require('./events')
const { moviesDir, outputDir, supportedExtensions } = require('../config/constants')
const { configFFmpeg } = require('./videoHelper')
const { updateStatus, createMovie } = require('../services/movieService')
const { enqueue } = require('../services/queueService')

logger.info('Конвертер запущен', { moviesDir, outputDir })

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

  if (!supportedExtensions.includes(fileExt)) return

  logger.info('Новый файл: %s', fileNameWithExt)

  try {
    const movie = await createMovie(fileNameWithExt, pureName)

    conversionEvents.emit('progress', { 
      type: 'NEW_MOVIE_DETECTED',
      status: 'new' 
    })

    // 2. ДОБАВЛЯЕМ В ОЧЕРЕДЬ КОНВЕРТАЦИИ
    if (!fs.existsSync(targetPath)) {
      logger.info('В очередь: %s', pureName)
      enqueue({ filePath, targetPath, fileName: pureName, fileExt })
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