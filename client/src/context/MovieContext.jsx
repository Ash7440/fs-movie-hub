import { useMovies } from '../hooks/useMovie'
import { MovieContext } from '../hooks/useMovieContext'

export const MovieProvider = ({ children }) => {
  const { movies, conversionProgress, baseUrl, setMovies, fetchMovies } = useMovies()

  return (
    <MovieContext.Provider value={{ movies, conversionProgress, baseUrl, setMovies, fetchMovies }}>
      {children}
    </MovieContext.Provider>
  )
}