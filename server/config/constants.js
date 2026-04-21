const path = require('path')

const moviesDir = path.resolve(__dirname, '../../downloads')

const outputDir = path.resolve(moviesDir, 'converted')

const supportedExtensions = ['.mkv', '.avi', '.mov', '.wmv', '.mp4']

module.exports = {
  moviesDir,
  outputDir,
  supportedExtensions
}