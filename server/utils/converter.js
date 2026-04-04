const chokidar = require('chokidar')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const fs = require('fs')
const conversionEvents = require('./events')
const Movie = require('../models/movie')

// 1. Используем абсолютный путь через process.cwd() или проверяем __dirname
const moviesDir = path.resolve(__dirname, '../../downloads')
const outputDir = path.resolve(moviesDir, 'converted')

console.log('--- ОТЛАДКА ПУТЕЙ ---')
console.log('Текущая директория скрипта:', __dirname)
console.log('Папка с фильмами:', moviesDir)
console.log('Папка для вывода:', outputDir)
console.log('----------------------')

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

const processNext = () => {
  if (processingQueue.length === 0 || isProcessing) return
  isProcessing = true
  const { filePath, targetPath, fileName, fileExt } = processingQueue.shift()

  const fullName = fileName + fileExt

  const pureName = path.basename(fileName, path.extname(fileName))

  console.log(`\nНачинаю работу над: ${fileName}${fileExt}`)
  
  let command = ffmpeg(filePath)

  if (fileExt === '.mkv') {
    // РЕЖИМ РЕМУКСА (БЫСТРЫЙ)
    command
      .videoCodec('copy')     // ПРЯМОЕ КОПИРОВАНИЕ ВИДЕО
      .audioCodec('aac')      // Конвертируем только звук
      .audioBitrate('192k')
      .outputOptions('-movflags +faststart')
  } else {
    // РЕЖИМ ПОЛНОГО ПЕРЕКОДИРОВАНИЯ (МЕДЛЕННЫЙ)
    command
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('192k')
      .outputOptions([
        '-preset fast',
        '-crf 22',
        '-movflags +faststart'
      ])
  }

  command
    .output(targetPath)
    .on('start', async (cmd) => {
       console.log('Команда FFmpeg:', cmd) // Это поможет увидеть, что реально выполняется
       console.log(fullName)

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
        // 2. ОТПРАВЛЯЕМ ДАННЫЕ В ШИНУ
        // Важно: имя файла должно совпадать с тем, что в базе (без расширения), 
        // чтобы фронтенд понял, к какой карточке относится этот процент.
        conversionEvents.emit('progress', { 
        fileName: pureName, // Это имя без расширения (pureName)
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
          { fileName: fullName }, // Ищем по имени
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
          { fileName: fullName }, // Ищем по имени
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
  depth: 0, // Поставь 1, если фильмы лежат в папках внутри downloads
  awaitWriteFinish: {
    stabilityThreshold: 3000, // ждать 3 секунды после последнего изменения размера
    pollInterval: 500         // проверять размер файла каждые 0.5 сек
  }
})

console.log('Запуск сканирования...')

watcher.on('add', (filePath) => {
  const fileExt = path.extname(filePath).toLowerCase()
  const fileName = path.basename(filePath, fileExt)
  const targetPath = path.join(outputDir, `${fileName}.mp4`)

  console.log(`Вижу файл: ${fileName}${fileExt}`)

  const supportedExtensions = ['.mkv', '.avi', '.mov', '.wmv']
  if (supportedExtensions.includes(fileExt)) {
    if (!fs.existsSync(targetPath)) {
      console.log(`Добавляю в очередь: ${fileName}`)
      processingQueue.push({ filePath, targetPath, fileName, fileExt })
      processNext()
    } else {
      console.log(`Пропускаю (уже есть mp4): ${fileName}`)
    }
  }
})

watcher.on('ready', () => {
  console.log('Сканирование завершено. Ожидаю новые файлы...')
})

watcher.on('error', error => console.log(`Ошибка Watcher: ${error}`))