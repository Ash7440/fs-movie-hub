import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Link, useMatch, } from 'react-router-dom'
import MovieGallery from './components/MovieGallery'

const baseUrl = import.meta.env.MODE === 'development' 
  ? 'http://localhost:3001' 
  : window.location.origin

// Общие стили для всего приложения (Dark Theme)
const theme = {
  bg: '#0a0a0a',
  cardBg: '#161616',
  accent: '#e50914',
  textMain: '#ffffff',
  textSecondary: '#a3a3a3',
  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

const VideoPlayer = ({ movie }) => {
  if (!movie) return <div style={{color: 'white', textAlign: 'center', padding: '50px'}}>Загрузка...</div>

  const url = `${baseUrl}/api/movies/${movie.playFile}`
  
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

  const fetchMovies = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/movies`)
      if (!response.ok) throw new Error('Unable to fetch data')
      const data = await response.json()
      setMovies(data)
      console.log('Список фильмов успешно обновлен:', data.length, 'шт.')
    } catch (err) {
      console.error('Ошибка загрузки фильмов:', err)
    }
  }, [])

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg
    document.body.style.margin = '0'
    document.body.style.fontFamily = theme.fontFamily

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
  }, [fetchMovies])

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