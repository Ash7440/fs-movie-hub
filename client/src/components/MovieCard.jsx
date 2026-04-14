import { Link } from 'react-router-dom'
import './MovieCard.css'
import { useMovieContext } from '../context/MovieContext'

const MovieCard = ({ movie }) => {
  const { conversionProgress } = useMovieContext()

  const pureName = movie.fileName.replace(/\.[^/.]+$/, "")
  const sseKeys = Object.keys(conversionProgress)
  const matchedKey = sseKeys.find(key => 
    pureName === key || pureName.includes(key) || key.includes(pureName)
  )

  const livePercent = matchedKey ? conversionProgress[matchedKey] : 0
  
  const showAsReady = movie.status === 'ready'
  const finalIsProcessing = !showAsReady

  return (
    <div style={{ position: 'relative' }}>
      <Link
        // Если в процессе — ссылка неактивна, если готов — ведем в плеер
        to={finalIsProcessing? '#' : `/movies/${encodeURIComponent(movie.playFile)}`}
        style={{ 
          textDecoration: 'none', 
          color: 'white',
          cursor: finalIsProcessing ? 'default' : 'pointer'
        }}
      >
        <div className="poster-container" style={{
          borderRadius: '12px',
          border: `1px solid ${finalIsProcessing ? '#333' : '#222'}`,
          transition: 'border-color 0.3s'
        }}>

          {/* 1. Слой с бликом и оверлеем (показываем, пока НЕ готов) */}
          {finalIsProcessing && (
            <>
              <div className="shimmer-layer" />
              <div className="progress-overlay">
                {/* Если процентов еще нет (0), пишем "Waiting", если есть — число */}
                <span className="percent-text">{livePercent > 0 ? `${livePercent}%` : '...'}</span>
                <span style={{ fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Optimizing
                </span>
              </div>
              {/* Мини прогресс-бар внизу карточки */}
              <div className="progress-bar-mini" style={{ width: `${livePercent}%` }} />
            </>
          )}
          {/* 2. Само изображение */}
          <img 
            src={movie.fullPosterUrl || 'https://via.placeholder.com/300x450?text=No+Poster'} 
            alt={movie.title}
            // Класс меняется строго по нашей новой логике
            className={`poster-img ${finalIsProcessing ? 'is-processing' : 'is-ready'}`}
          />
        </div>
        {/* Заголовок */}
        <div style={{ marginTop: '12px' }}>
          <h4 style={{ 
            margin: 0, 
            fontSize: '0.9rem', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            // Приглушаем текст, если фильм еще не готов
            opacity: finalIsProcessing ? 0.4 : 1,
            transition: 'opacity 0.5s'
          }}>
            {movie.title}
          </h4>
        </div>
      </Link>
    </div>
  )
}

export default MovieCard