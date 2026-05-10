import { useEffect, useState } from 'react'
import { Routes, Route, Link, useMatch, } from 'react-router-dom'
import MovieGallery from './components/MovieGallery'
import VideoPlayer from './components/VideoPlayer'
import UserSelectorModal from './components/UserSelectorModal'
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

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('cinema_user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg
    document.body.style.margin = '0'
    document.body.style.fontFamily = theme.fontFamily
  }, [])

  const handleSelectUser = (user) => {
    setCurrentUser(user)
    localStorage.setItem('cinema_user', JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('cinema_user')
  }

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
      {/* Если пользователь не выбран — показываем модалку */}
      {!currentUser && (
        <UserSelectorModal isOpen={true} onSelectUser={handleSelectUser} />
      )}

      {/* Основной контент показываем всегда или только после выбора */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h2 style={{ color: theme.accent, margin: 0, letterSpacing: '1px' }}>HOME CINEMA</h2>
          </Link>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '20px' }}>
              <img 
                src={`${baseUrl}${currentUser.avatarPath}`} 
                style={{ width: '30px', borderRadius: '4px' }} 
                alt="avatar" 
              />
              <span style={{ fontSize: '0.9rem', color: theme.textSecondary }}>{currentUser.username}</span>
              <button 
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Выйти
              </button>
            </div>
          )}
        </div>
        <span style={{color: theme.textSecondary, fontSize: '0.9rem'}}>v2.0 Beta</span>
      </header>

      <Routes>
        <Route path='/' element={<MovieGallery movies={movies} />} />
        {/* Передаем currentUser в плеер, чтобы сохранять тайминги именно для него */}
        <Route path='/movies/:filename' element={
          <VideoPlayer movie={movie} baseUrl={baseUrl} theme={theme} user={currentUser} />
        } />
      </Routes>
    </div>
  )
}

export default App