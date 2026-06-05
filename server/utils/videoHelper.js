const logger = require('./logger')

const configFFmpeg = (command, fileExt, videoCodecName) => {
  const hlsOptions = [
    '-hls_time 10',
    '-hls_list_size 0',
    '-f hls'
  ]

  if ((fileExt === '.mkv' || fileExt === '.mp4') && videoCodecName === 'h264') {
    logger.info('Прямое копирование видеопотока')
    return command
      .videoCodec('copy')
      .outputOptions([
        '-map 0:v:0',
        '-map 0:a?',
        '-c:a aac',
        '-ac 2',
        '-b:a 192k',
        ...hlsOptions
      ])
  } else {
    logger.info('Перекодирование видеопотока')
    return command
      .videoCodec('h264_nvenc')
      .outputOptions([
        '-map 0:v:0',       
        '-map 0:a?',        
        '-preset slow',
        '-profile:v high',
        '-pix_fmt yuv420p',
        '-rc vbr',
        '-cq 24',
        '-gpu 0',
        '-c:a aac',         
        '-ac 2',            
        '-b:a 192k',        
        ...hlsOptions
      ])
  }
}

module.exports = { configFFmpeg }