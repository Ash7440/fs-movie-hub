import { useMovies } from '../hooks/useMovie'
import { MovieContext } from '../hooks/useMovieContext'

export const MovieProvider = ({ children }) => {
  const { movies, conversionProgress, baseUrl, setMovies } = useMovies()

  return (
    <MovieContext.Provider value={{ movies, conversionProgress, baseUrl, setMovies }}>
      {children}
    </MovieContext.Provider>
  )
}