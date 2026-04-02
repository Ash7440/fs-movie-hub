const chokidar = require('chokidar')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const fs = require('fs')

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

  console.log(`\n🎬 Начинаю работу над: ${fileName}${fileExt}`)
  
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
    .on('start', (cmd) => {
       console.log('Команда FFmpeg:', cmd) // Это поможет увидеть, что реально выполняется
    })
    .on('progress', (p) => {
      // При copy процент может быть неточным, ориентируйся на скорость появления лога Готово
      process.stdout.write(`\rОбработка [${fileName}]: ${Math.round(p.percent || 0)}% (скорость: ${p.currentFps} fps)`)
    })
    .on('end', () => {
      console.log(`\nГотово: ${fileName}.mp4`)
      isProcessing = false
      processNext()
    })
    .on('error', (err) => {
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
  depth: 0 // Поставь 1, если фильмы лежат в папках внутри downloads
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