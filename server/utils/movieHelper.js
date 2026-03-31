const cleanMovieName = (file) => {
  const query = file
    .replace(/\.[^/.]+$/, '') // убираем расширение
    .replace(/[._-]/g, ' ')   // точки/тире в пробелы
    .replace(/\s+/g, ' ')     // убираем двойные пробелы
    // Убираем год (4 цифры подряд) и всё, что после него
    .replace(/\b(19|20)\d{2}\b.*/, '')
    // Убираем технический мусор и скобки
    .replace(/(1080p|720p|BDRip|WEB-DL|x264|x265|HEVC|SOFCJ|[\[\]()]).*/i, '') 
    .trim()

  return query
}

module.exports = { cleanMovieName }