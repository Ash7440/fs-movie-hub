const chokidar = require('chokidar')
const ffmpeg = require('fluent-ffmpeg')
const fetch = require('node-fetch')
const path = require('path')
const fs = require('fs')

const conversionEvents = require('./events')
const Movie = require('../models/movie')
const movieHelper = require('./movieHelper')
const { tmdbConfig } = require('../config/tmdb')
const downloadPoster = require('./downloadPoster')

const moviesDir = path.resolve(__dirname, '../../downloads')
const outputDir = path.resolve(moviesDir, 'converted')

console.log('--- ОТЛАДКА ПУТЕЙ ---')
console.log('Папка с фильмами:', moviesDir)
console.log('Папка для вывода:', outputDir)
console.log('----------------------')

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
    console.log('Попытка создать папку converted...')
    fs.mkdirSync(outputDir, { recursive: true })
    console.log('Папка создана успешно')
  } else {
    console.log('Папка converted уже существует')
  }
} catch (err) {
  console.error('Ошибка при создании папки:', err.message)
}

let processingQueue = []
let isProcessing = false

const processNext = async () => {
  if (processingQueue.length === 0 || isProcessing) return
  isProcessing = true
  const { filePath, targetPath, fileName, fileExt } = processingQueue.shift()

  const fullName = fileName + fileExt

  const pureName = path.basename(fileName, path.extname(fileName))

  console.log(`\nНачинаю работу над: ${fileName}${fileExt}`)

  let videoCodecName = null

  try {
    const metadata = await getMediaInfo(filePath)
    const videoStream = metadata.streams.find(s => s.codec_type === 'video')

    if (videoStream) {
      videoCodecName = videoStream.codec_name
      console.log(`Обноружен видеокодек: ${videoCodecName}`)
    }
  } catch (err) {
    console.error(`Ошибка при чтении файла ${fileName}`, err.message)
    isProcessing = false
    processNext()
    return
  }
  
  let command = ffmpeg(filePath)

  if ((fileExt === '.mkv' || fileExt === '.mp4') && videoCodecName === 'h264') {
    console.log('Прямое копирование видеопотока')
    command
      .videoCodec('copy')
      .audioCodec('aac')
      .audioChannels(2)
      .audioBitrate('192k')
      .outputOptions('-movflags +faststart')
  } else {
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
       console.log('Команда FFmpeg:', cmd)

      try {
        await Movie.findOneAndUpdate(
          { fileName: fullName}, // Ищем по имени
          { status: 'processing' }                 
        )
        console.log(`\nСтатус в БД обновлен: ${pureName}`)
      } catch (err) {
        console.error('Ошибка обновления БД:', err.message)
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
    })
    .on('end', async () => {
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
        console.log(`\nСтатус в БД обновлен: ${pureName}`)
      } catch (err) {
        console.error('Ошибка обновления БД:', err.message)
      }

      console.log(`\nГотово: ${pureName}.mp4`)
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
        console.log(`\nСтатус в БД обновлен: ${pureName}`)
      } catch (err) {
        console.error('Ошибка обновления БД:', err.message)
      }

      console.error(`\nОшибка FFmpeg (${fileName}):`, err.message)
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

console.log('Запуск сканирования...')

watcher.on('add', async (filePath) => {
  const fileExt = path.extname(filePath).toLowerCase()
  const fileNameWithExt = path.basename(filePath)
  const pureName = path.basename(filePath, fileExt)
  const targetPath = path.join(outputDir, `${pureName}.mp4`)

  const supportedExtensions = ['.mkv', '.avi', '.mov', '.wmv', '.mp4']
  if (!supportedExtensions.includes(fileExt)) return

  console.log(`\nВижу новый файл: ${fileNameWithExt}`)

  try {
    let movie = await Movie.findOne({ fileName: fileNameWithExt })

    if (!movie) {
      console.log(`Создаю запись в БД для: ${pureName}`)
      const query = movieHelper.cleanMovieName(fileNameWithExt)
      
      // Запрос к TMDB
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=ru-RU&page=1`, 
        tmdbConfig()
      )

      const arrMovies = await response.json()
      const data = arrMovies?.results?.[0]

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
      console.log(`Запись создана: ${movie.title}`)

      conversionEvents.emit('progress', { 
        type: 'NEW_MOVIE_DETECTED',
        status: 'new' 
      })
    }

    // 2. ДОБАВЛЯЕМ В ОЧЕРЕДЬ КОНВЕРТАЦИИ
    if (!fs.existsSync(targetPath)) {
      console.log(`В очередь: ${pureName}`)
      processingQueue.push({ filePath, targetPath, fileName: pureName, fileExt })
      processNext()
    } else {
      console.log(`Уже сконвертирован: ${pureName}`)
      // Если файл уже есть на диске, убеждаемся что в базе статус 'ready'
      if (movie.status !== 'ready') {
        movie.status = 'ready'
        await movie.save()
      }
    }
  } catch (err) {
    console.error(`Ошибка Watcher (add):`, err.message)
  }
})

watcher.on('ready', () => {
  console.log('Сканирование завершено. Ожидаю новые файлы...')
})

watcher.on('error', error => console.log(`Ошибка Watcher: ${error}`))