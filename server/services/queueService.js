const logger = require('../utils/logger')
const { processVideo } = require('./videoService')

let queue = []
let isProcessing = false

const enqueue = (job) => {
  queue.push(job)
  logger.info('Файл добавлен в очередь. Всего в очереди: %d', queue.length)
  processNext()
}

const processNext = async () => {
  if (queue.length === 0 || isProcessing) return
  
  isProcessing = true
  const currentJob = queue.shift()

  try {
    await processVideo(currentJob)
  }catch (err) {
    logger.error('Задача завершилась с ошибкой')
  } finally {
    isProcessing = false
    processNext()
  }
}

module.exports = { enqueue }