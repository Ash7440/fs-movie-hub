import { useEffect } from 'react'
import { Routes, Route, Link, useMatch, } from 'react-router-dom'
import MovieGallery from './components/MovieGallery'
import VideoPlayer from './components/VideoPlayer'
import { useMovieContext } from './hooks/useMovieContext'

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
  const { movies, baseUrl } = useMovieContext()

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg
    document.body.style.margin = '0'
    document.body.style.fontFamily = theme.fontFamily
  }, [])

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
        <Route path='/' element={<MovieGallery movies={movies} />} />
        <Route path='/movies/:filename' element={<VideoPlayer movie={movie} baseUrl={baseUrl} theme={theme} />} />
      </Routes>
    </div>
  )
}

export default App