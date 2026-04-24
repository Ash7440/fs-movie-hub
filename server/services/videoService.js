const ffmpeg = require('fluent-ffmpeg')
const logger = require('../utils/logger')
const conversionEvents = require('../utils/events')
const { configFFmpeg } = require('../utils/videoHelper')
const { updateStatus } = require('./movieService')

const getMediaInfo = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err)
      else resolve(metadata)
    })
  })
}

const processVideo = async (job) => {
  const { filePath, targetPath, fileName, fileExt } = job
  const fullName = fileName + fileExt
  const pureName = fileName

  logger.info('Начата конвертация %s%s', fileName, fileExt)

  try {
    const metadata = await getMediaInfo(filePath)
    const videoStream = metadata.streams.find(s => s.codec_type === 'video')
    const videoCodecName = videoStream ? videoStream.codec_name : null

    return new Promise((resolve, reject) => {
      let command = ffmpeg(filePath)

      command = configFFmpeg(command, fileExt, videoCodecName)

      command
        .output(targetPath)
        .on('start', async (cmd) => {
          logger.info('Команда FFmpeg: %s', cmd)
          await updateStatus(fullName, 'processing')
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
            logger.info('Конвертация фильма %s: пройден этап %d%%', fileName, percent)
          }
        })
        .on('end', async () => {
          process.stdout.write('\n')
          conversionEvents.emit('progress', { 
            fileName: pureName, 
            percent: 100, 
            status: 'done' 
          })
          await updateStatus(fullName, 'ready')

          logger.info('Готово: %s.mp4', pureName)
          resolve()
        })
        .on('error', async (err) => {
          conversionEvents.emit('progress', { 
            fileName: pureName, 
            status: 'error',
            message: err.message 
          })
          await updateStatus(fullName, 'error')
          logger.error('Ошибка FFmpeg в файле %s: %s', fileName, err.message, { stack: err.stack })
          reject(err)
        })
        .run()
    })
  } catch (err) {
    logger.error('Ошибка при чтении файла', {
      filename: fileName,
      message: err.message,
      stack: err.stack
    })
    throw err
  }
}

module.exports = { processVideo }