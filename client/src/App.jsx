import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Link, useMatch, } from 'react-router-dom'

// Общие стили для всего приложения (Dark Theme)
const theme = {
  bg: '#0a0a0a',
  cardBg: '#161616',
  accent: '#e50914', // Красный как у Netflix для акцентов
  textMain: '#ffffff',
  textSecondary: '#a3a3a3',
  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

const MovieGallery = ({ movies, conversionProgress }) => {
  // CSS для анимаций
  const appleStyles = `
    @keyframes shimmer {
      0% { transform: translateY(120%); }
      100% { transform: translateY(-120%); }
    }

    .poster-container {
      position: relative;
      width: 100%;
      aspect-ratio: 2/3;
      background: #111;
      overflow: hidden;
    }

    .poster-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: filter 1.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s ease;
    }

    /* Когда фильм в обработке — он ЧБ и темный */
    .is-processing {
      filter: grayscale(1) brightness(0.4);
    }

    /* Когда готов — становится цветным */
    .is-ready {
      filter: grayscale(0) brightness(1);
    }

    /* Эффект блика Apple */
    .shimmer-layer {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(
        to bottom,
        transparent,
        rgba(255, 255, 255, 0.08),
        transparent
      );
      animation: shimmer 3s infinite linear;
      z-index: 2;
      pointer-events: none;
    }

    /* Контейнер для текста прогресса */
    .progress-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 3;
      color: white;
      font-family: sans-serif;
    }

    .percent-text {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -1px;
      margin-bottom: 8px;
      text-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }

    /* Тонкая линия прогресса снизу */
    .progress-bar-mini {
      position: absolute;
      bottom: 0; left: 0; height: 4px;
      background: #e50914;
      transition: width 0.4s ease;
      box-shadow: 0 0 10px #e50914;
      z-index: 4;
    }
  `

 return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '30px',
      padding: '40px',
      maxWidth: '1300px',
      margin: '0 auto'
    }}>
      <style>{appleStyles}</style>
      
      {movies.map((movie) => {
        const pureName = movie.fileName.replace(/\.[^/.]+$/, "");
        const sseKeys = Object.keys(conversionProgress);
        const matchedKey = sseKeys.find(key => 
          pureName === key || pureName.includes(key) || key.includes(pureName)
        );
        
        const livePercent = matchedKey ? conversionProgress[matchedKey] : 0;
        
        const showAsReady = movie.status === 'ready'
        const finalIsProcessing = !showAsReady;

        return (
          <div key={movie.fileName} style={{ position: 'relative' }}>
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
      })}
    </div>
  )
}

const VideoPlayer = ({ movie }) => {
  if (!movie) return <div style={{color: 'white', textAlign: 'center', padding: '50px'}}>Загрузка...</div>;

  const url = `http://localhost:3001/api/movies/${movie.playFile}`
  
  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px',
      color: theme.textMain,
    },
    videoWrapper: {
      width: '100%',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
      backgroundColor: '#000',
    },
    details: {
      marginTop: '30px',
    },
    title: {
      fontSize: '2rem',
      marginBottom: '10px',
      color: theme.accent,
    },
    overview: {
      lineHeight: '1.6',
      color: theme.textSecondary,
      fontSize: '1.1rem',
    }
  }

  return (
    <div style={styles.container}>
      <Link to="/" style={{color: theme.accent, textDecoration: 'none', marginBottom: '20px', display: 'block'}}>
        ← Назад к списку
      </Link>
      <div style={styles.videoWrapper}>
        <video width='100%' controls autoPlay>
          <source src={url} type="video/mp4" />
          Ваш браузер не поддерживает видео-тег.
        </video>
      </div>
      <div style={styles.details}>
        <h1 style={styles.title}>{movie.title}</h1>
        <p style={styles.overview}>{movie.overview || 'Описание отсутствует.'}</p>
      </div>
    </div>
  )
}

const App = () => {
  const [movies, setMovies] = useState([])
  const [conversionProgress, setConversionProgress] = useState({})

  const baseUrl = 'http://localhost:3001'

  const fetchMovies = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/movies`);
      if (!response.ok) throw new Error('Unable to fetch data');
      const data = await response.json();
      setMovies(data);
      console.log('✅ Список фильмов успешно обновлен:', data.length, 'шт.');
    } catch (err) {
      console.error('Ошибка загрузки фильмов:', err);
    }
  }, [baseUrl])

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
    document.body.style.margin = '0';
    document.body.style.fontFamily = theme.fontFamily;

    fetchMovies()
  }, [fetchMovies])

  useEffect(() => {
    const eventSource = new EventSource(`${baseUrl}/api/movies/status`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE Update:', data)

        if (data.type === 'NEW_MOVIE_DETECTED') {
          console.log('Пойман сигнал о новом фильме! Перезапрашиваем...')
           fetchMovies()
           return // Дальше не идем
        }

        if (data.fileName) {
            setConversionProgress(prev => ({
              ...prev,
              [data.fileName]: data.percent
            }))
        }

        if (data.status === 'done') {
          setTimeout(() => {
            fetchMovies()
          }, 5000)
        } 
      } catch (err) {
        console.error('Failed to parse SSE:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE error', err)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [baseUrl, fetchMovies])

  const match = useMatch('/movies/:filename')
  const movie = match ? movies.find(m => m.playFile === match.params.filename) : null

  const headerStyle = {
    padding: '20px 40px',
    borderBottom: '1px solid #222',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }

  return (
    <div style={{ minHeight: '100vh', color: theme.textMain }}>
      <header style={headerStyle}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h2 style={{ color: theme.accent, margin: 0, letterSpacing: '1px' }}>HOME CINEMA</h2>
        </Link>
        <span style={{color: theme.textSecondary, fontSize: '0.9rem'}}>v2.0 Beta</span>
      </header>

      <Routes>
        <Route path='/' element={<MovieGallery movies={movies} conversionProgress={conversionProgress} />} />
        <Route path='/movies/:filename' element={<VideoPlayer movie={movie} />} />
      </Routes>
    </div>
  )
}

export default App