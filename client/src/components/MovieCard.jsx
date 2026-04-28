import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { MoreVertical, Trash2 } from 'lucide-react'

import './MovieCard.css'
import { useMovieContext } from '../hooks/useMovieContext'
import deleteMovie from '../../services/movies'

const MovieCard = ({ movie, isMenuOpen, onMenuToggle }) => {
  const { conversionProgress, baseUrl, setMovies } = useMovieContext()

  const toggleMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onMenuToggle(!isMenuOpen)
  }

  useEffect(() => {
  if (!isMenuOpen) return
    const closeMenu = () => onMenuToggle(false)
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [isMenuOpen, onMenuToggle])

  const handleDelete = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (window.confirm(`Delete movie: ${movie.title}?`)) {
      try {
        const response = await deleteMovie(movie.id)

        if (response.ok) {
          setMovies(prev => prev.filter(m => m.id !== movie.id))
        }
      } catch (err) {
        console.error('Failed to delete: ', err)
      }
    }
  }

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
            src={`${baseUrl}${movie.localPosterPath}` || 'https://via.placeholder.com/300x450?text=No+Poster'} 
            alt={movie.title}
            // Класс меняется строго по нашей новой логике
            className={`poster-img ${finalIsProcessing ? 'is-processing' : 'is-ready'}`}
          />
        </div>
        {/* Заголовок */}
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h4 style={{ 
            margin: 0, 
            fontSize: '0.9rem', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            opacity: finalIsProcessing ? 0.4 : 1,
            flex: 1
          }}>
            {movie.title}
          </h4>
        
          {/* Кнопка три точки */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={toggleMenu}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
            >
              {/* Иконка трех точек */}
              <MoreVertical size={16} />
            </button>
            
            {/* Выпадающий список */}
            {isMenuOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '30px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                zIndex: 100,
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                padding: '4px' // Небольшой отступ внутри меню
              }}>
                <button 
                  onClick={handleDelete}
                  title="Удалить фильм" // Подсказка при наведении
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',   // Делаем кнопку квадратной
                    height: '40px',
                    background: 'none',
                    border: 'none',
                    color: '#ff4d4d',
                    cursor: 'pointer',
                    borderRadius: '6px', // Скругляем углы при наведении
                    transition: 'background 0.2s, transform 0.1s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a1212'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default MovieCard