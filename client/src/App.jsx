import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Link, useMatch, } from 'react-router-dom'
import MovieGallery from './components/MovieGallery'
import VideoPlayer from './components/VideoPlayer'

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
        <Route path='/movies/:filename' element={<VideoPlayer movie={movie} baseUrl={baseUrl} theme={theme} />} />
      </Routes>
    </div>
  )
}

export default App