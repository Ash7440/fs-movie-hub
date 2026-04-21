const logger = require('./logger')

const configFFmpeg = (command, fileExt, videoCodecName) => {
  if ((fileExt === '.mkv' || fileExt === '.mp4') && videoCodecName === 'h264') {
    logger.info('Прямое копирование видеопотока')
    return command
      .videoCodec('copy')
      .audioCodec('aac')
      .audioChannels(2)
      .audioBitrate('192k')
      .outputOptions('-movflags +faststart')
  } else {
    logger.info('Перекодирование видеопотока')
    return command
      .videoCodec('h264_nvenc')
      .outputOptions([
        '-preset slow',
        '-profile:v high',
        '-pix_fmt yuv420p',
        '-rc vbr',
        '-cq 24',
        '-gpu 0',
        '-movflags +faststart'
      ])
      .audioCodec('aac')
      .audioChannels(2)
      .audioBitrate('192k')
  }
}

module.exports = { configFFmpeg }