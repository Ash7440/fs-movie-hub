import { useState, useEffect } from 'react'
import { Routes, Route, Link, useMatch } from 'react-router-dom'

const MovieGallery = ({ movies }) => {
  const styles = {
    gridContainer: {
      display: 'grid',
      // Автоматическое создание колонок: минимум 200px, максимум — сколько влезет
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '20px',
      padding: '20px',
      listStyle: 'none',
    },
    card: {
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'pointer',
      textDecoration: 'none',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },
    imageWrapper: {
      width: '100%',
      aspectRatio: '2/3', // Соотношение сторон как у кинопостеров
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover', // Чтобы картинка не растягивалась
    },
    title: {
      padding: '12px',
      fontSize: '1rem',
      fontWeight: 'bold',
      textAlign: 'center',
      // Обрезка текста, если название слишком длинное
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }
  }

  return (
    <ul style={styles.gridContainer}>
      {movies.map((movie) => (
        <li key={movie.name}>
          <Link 
            to={`/watch/${encodeURIComponent(movie.name)}`} 
            style={styles.card}
            // Эффект увеличения при наведении (можно добавить через обычный CSS)
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={styles.imageWrapper}>
              <img
                src={movie.poster || 'https://via.placeholder.com/200x300?text=No+Poster'}
                alt={movie.title}
                style={styles.image}
                loading="lazy"
              />
            </div>
            <div style={styles.title} title={movie.title}>
              {movie.title}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

const VideoPlayer = ({ movie }) => {
  const url = `http://localhost:3001/api/video/${movie.name}`

  return (
    <div>
      <h3>Сейчас играет: {(movie.title)}</h3>
      <video width='100%' controls autoPlay>
        <source src={url} type="video/mp4" />
        Ваш браузер не поддерживает видео-тег.
      </video>
      <div>
        {movie.overview}
      </div>
    </div>
  )
}


const App = () => {
  const [movies, setMovies] = useState([])

  const baseUrl = 'http://localhost:3001'

  useEffect(() => {
    const fetchMovies = async () => {
      const response = await fetch(`${baseUrl}/api/movies`)

      if (!response.ok) {
        throw new Error('Unable to fetch data')
      }

      const data = await response.json()
      setMovies(data)
    }
    fetchMovies()
  }, [])

  const match = useMatch('/watch/:filename')
  const movie = match ? movies.find(movie => movie.name === match.params.filename) : null

  return (
    <div>
      <h2>Home Cinema</h2>
      <Routes>
        <Route path='/' element={<MovieGallery movies={movies} />} />
        <Route path='/watch/:filename' element={<VideoPlayer movie={movie} />} />
      </Routes>
    </div>
  )
}

export default App