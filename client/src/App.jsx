import { useState, useEffect } from 'react'

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

  console.log(movies)

  return (
    <div>
      <h2>Home Cinema</h2>
      <ul>
        {movies.map(movie =>
          <li>{movie}</li>
        )}
      </ul>
    </div>
  )
}

export default App