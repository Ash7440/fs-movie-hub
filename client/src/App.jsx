import { useEffect, useState, useRef } from 'react'
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('cinema_user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg
    document.body.style.margin = '0'
    document.body.style.fontFamily = theme.fontFamily

    const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false)
    }
  }

  if (isDropdownOpen) {
    document.removeEventListener('mousedown', handleClickOutside)
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside)
  }
  }, [isDropdownOpen])

  const handleSelectUser = (user) => {
    setCurrentUser(user)
    localStorage.setItem('cinema_user', JSON.stringify(user))
    setIsDropdownOpen(false)
  }

  const logoutAction = () => {
    setCurrentUser(null)
    localStorage.removeItem('cinema_user')
    setIsDropdownOpen(false)
  }

  const handleSwitchUser = () => {
    logoutAction()
  }

  const handleLogout = () => {
    logoutAction()
  }

  const match = useMatch('/movies/:filename')
  const movie = match ? movies.find(m => m.playFile === match.params.filename) : null

  const headerStyle = {
    padding: '15px 40px', // Немного компактнее
    borderBottom: '1px solid #222',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.bg,
    position: 'relative', // Для позиционирования дропдауна
    zIndex: 10 // Чтобы шапка была поверх контента плеера
  }

  const logoGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  }

  // Контейнер аватарки и меню (справа)
  const userControlStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  }

  const avatarButtonStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%', // Круглая
    cursor: 'pointer',
    border: isDropdownOpen ? `2px solid ${theme.accent}` : '2px solid #333',
    transition: 'all 0.2s ease',
    objectFit: 'cover' // Чтобы фото не сплющивалось
  }

  // Стили самого выпадающего окна
  const dropdownMenuStyles = {
    position: 'absolute',
    top: '100%', // Сразу под аватаркой
    right: 0, // Выравнивание по правому краю
    marginTop: '12px',
    backgroundColor: theme.cardBg,
    border: '1px solid #333',
    borderRadius: '8px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.7)',
    zIndex: 100,
    minWidth: '200px',
    overflow: 'hidden', // Для скругления углов у children
    animation: 'fadeInSlide 0.2s ease-out'
  }

  // Стили элементов меню
  const dropdownItemStyles = {
    display: 'block',
    width: '100%',
    background: 'none',
    border: 'none',
    color: theme.textMain,
    padding: '12px 16px',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background 0.2s',
    outline: 'none'
  }

  const userInfoHeaderStyle = {
    padding: '16px',
    borderBottom: '1px solid #333',
    color: theme.textSecondary,
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  }

  return (
    <div style={{ minHeight: '100vh', color: theme.textMain }}>
      {/* CSS Анимация для меню */}
      <style>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown-item:hover { background-color: #222; }
      `}</style>

      {/* Модалка выбора, если user === null */}
      {!currentUser && (
        <UserSelectorModal isOpen={true} onSelectUser={handleSelectUser} />
      )}

      <header style={headerStyle}>
        {/* ЛЕВАЯ ЧАСТЬ: Лого и Версия */}
        <div style={logoGroupStyle}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h2 style={{ color: theme.accent, margin: 0, letterSpacing: '1px' }}>HOME CINEMA</h2>
          </Link>
          <span style={{color: theme.textSecondary, fontSize: '0.8rem', marginTop: '5px'}}>v2.0 Beta</span>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: Аватар и Дропдаун */}
        {currentUser && (
          <div style={userControlStyle} ref={dropdownRef}>
            <img 
              src={`${baseUrl}${currentUser.avatarPath}`} 
              style={avatarButtonStyle} 
              alt="avatar"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Переключаем меню
            />
            
            {/* Само выпадающее меню */}
            {isDropdownOpen && (
              <div style={dropdownMenuStyles}>
                <div style={userInfoHeaderStyle}>
                  {currentUser.username}
                </div>
                
                <button 
                  onClick={handleSwitchUser}
                  className="dropdown-item"
                  style={dropdownItemStyles}
                >
                  Сменить пользователя
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="dropdown-item"
                  style={{...dropdownItemStyles, color: theme.accent, borderTop: '1px solid #333'}}
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <Routes>
        <Route path='/' element={<MovieGallery movies={movies} />} />
        <Route path='/movies/:filename' element={
          <VideoPlayer movie={movie} baseUrl={baseUrl} theme={theme} user={currentUser} />
        } />
      </Routes>
    </div>
  )
}

export default App