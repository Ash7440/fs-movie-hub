import { useState, useEffect } from 'react'
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

const MovieGallery = ({ movies }) => {
  const styles = {
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '25px',
      padding: '40px 20px',
      maxWidth: '1200px',
      margin: '0 auto',
      listStyle: 'none',
    },
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      cursor: 'pointer',
      textDecoration: 'none',
      color: theme.textMain,
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #222',
      position: 'relative',
    },
    imageWrapper: {
      width: '100%',
      aspectRatio: '2/3',
      overflow: 'hidden',
      backgroundColor: '#222',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    info: {
      padding: '12px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
    },
    title: {
      fontSize: '0.95rem',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      margin: 0,
    }
  }

  return (
    <ul style={styles.gridContainer}>
      {movies.map((movie) => (
        <li key={movie.fileName}>
          <Link 
            to={`/movies/${encodeURIComponent(movie.fileName)}`} 
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.8)';
              e.currentTarget.style.borderColor = theme.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#222';
            }}
          >
            <div style={styles.imageWrapper}>
              <img
                src={movie.fullPosterUrl || 'https://via.placeholder.com/300x450?text=No+Poster'}
                alt={movie.title}
                style={styles.image}
                loading="lazy"
              />
            </div>
            <div style={styles.info}>
              <p style={styles.title} title={movie.title}>{movie.title}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
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

  useEffect(() => {
    document.body.style.backgroundColor = theme.bg;
    document.body.style.margin = '0';
    document.body.style.fontFamily = theme.fontFamily;

    const fetchMovies = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/movies`)
        if (!response.ok) throw new Error('Unable to fetch data')
        const data = await response.json()
        setMovies(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchMovies()
  }, [])

  useEffect(() => {
    const eventSource = new EventSource(`${baseUrl}/api/status`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE Update:', data)

        setConversionProgress(prev => ({
          ...prev,
          [data.fileName]: data.percent
        }))

        if (data.status === 'done') {
          setTimeout(() => {
            fetch(`${baseUrl}/api/movies`)
              .then(res => res.json())
              .then(data => setMovies(data))
          }, 1000)
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
  }, [baseUrl])

  const match = useMatch('/movies/:filename')
  const movie = match ? movies.find(m => m.fileName === match.params.filename) : null

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
        <Route path='/movies/:filename' element={<VideoPlayer movie={movie} />} />
      </Routes>
    </div>
  )
}

export default App