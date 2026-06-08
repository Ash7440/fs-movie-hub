const logger = require('./logger')

const configFFmpeg = (command, fileExt, videoCodecName, audioStreams = []) => {
  const hlsOptions = [
    '-f hls',
    '-hls_time 10',
    '-hls_list_size 0',
    '-hls_playlist_type vod',
    '-master_pl_name index.m3u8',
    '-hls_flags independent_segments'
  ]

  const outputOptions = ['-map 0:v:0']
  
  audioStreams.forEach((stream, index) => {
    outputOptions.push(`-map 0:a:${index}`)
  })

  let varStreamMap = ''

  if (audioStreams.length <= 1) {
    varStreamMap = 'v:0,a:0'
  } else {
    varStreamMap = 'v:0,agroup:audio'

    audioStreams.forEach((stream, index) => {
      let lang = stream.tags?.language || `ch_${index}`
      lang = lang.replace(/["']/g, '').replace(/[\s,/\\]+/g, '_')

      let title = stream.tags?.title || (lang === 'rus' ? 'Русский' : lang === 'eng' ? 'English' : `Дорожка_${index + 1}`)
      title = title.replace(/["']/g, '').replace(/[\s,/\\]+/g, '_')
      
      const isDefault = index === 0 ? 'yes' : 'no'

      varStreamMap += ` a:${index},agroup:audio,default:${isDefault},language:${lang},name:${title}`
    })
  }

  outputOptions.push('-var_stream_map', varStreamMap)

  if ((fileExt === '.mkv' || fileExt === '.mp4') && videoCodecName === 'h264') {
   logger.info('Прямое копирование видеопотока')
   command.videoCodec('copy')
  } else {
    logger.info('Перекодирование видеопотока через NVENC')
    command.videoCodec('h264_nvenc').outputOptions([
      '-preset slow',
      '-profile:v high',
      '-pix_fmt yuv420p',
      '-rc vbr',
      '-cq 24',
      '-gpu 0',
      '-g 48',
      '-keyint_min 48',
      '-sc_threshold 0'
    ])
  }

  command.audioCodec('aac')
    .audioChannels(2)
    .audioBitrate('192k')

  return command.outputOptions([...outputOptions, ...hlsOptions])
}

module.exports = { configFFmpeg }