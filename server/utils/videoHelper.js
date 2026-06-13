const path = require('path')
const logger = require('./logger')

const configFFmpeg = (command, fileExt, videoCodecName, audioStreams = [], targetPath = '') => {
  let resolvedPath = targetPath
  
  if (!resolvedPath) {
    const outputPath = command._outputs?.[0]?.target || ''
    resolvedPath = outputPath ? path.dirname(outputPath) : '.'
  }

  const safeTargetPath = resolvedPath.replace(/\\/g, '/')

  const hlsOptions = [
    '-f', 'hls',
    '-hls_time', '10',
    '-hls_list_size', '0',
    '-hls_playlist_type', 'vod',
    '-master_pl_name', 'index.m3u8',
    '-hls_flags', 'independent_segments',
    '-hls_segment_type', 'fmp4',
    '-hls_fmp4_init_filename', `${safeTargetPath}/index_%v_init.mp4`,
    '-hls_segment_filename', `${safeTargetPath}/index_%v_%03d.m4s` 
  ]

  const outputOptions = ['-map', '0:v:0']
  
  audioStreams.forEach((stream, index) => {
    outputOptions.push('-map', `0:a:${index}`)
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

  logger.info('Перекодирование видеопотока в 4K HEVC через NVENC')
  command.videoCodec('hevc_nvenc').outputOptions([
    '-preset slow',
    '-profile:v main',
    '-pix_fmt yuv420p',
    '-vtag hvc1',
    '-rc vbr',
    '-cq 26',              
    '-maxrate 12M',        
    '-bufsize 24M',
    '-gpu 0',
    '-g 48',
    '-no-scenecut 1',
    '-forced-idr 1',
    '-vsync cfr'
  ])

  command.audioCodec('aac')
    .audioChannels(2)
    .audioBitrate('192k')

  return command.outputOptions([...outputOptions, ...hlsOptions])
}

module.exports = { configFFmpeg }