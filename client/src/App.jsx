import { useState, useEffect } from 'react'
import { Routes, Route, Link, useMatch } from 'react-router-dom'

const MovieGallery = ({ movies }) => {

  return (
    <ul>
      {movies.map(movie => (
        <li key={movie}>
          <Link to={`watch/${encodeURIComponent(movie)}`}>{movie}</Link>
        </li>
      ))}
    </ul>
  )
}

const VideoPlayer = ({ movie }) => {
  const url = `http://localhost:3001/api/video/${movie}`

  return (
    <div>
      <h3>Сейчас играет: {decodeURIComponent(movie)}</h3>
      <video width='100%' controls autoPlay>
        <source src={url} type="video/mp4" />
        Ваш браузер не поддерживает видео-тег.
      </video>
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
  const movie = match ? movies.find(movie => movie === match.params.filename) : null

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