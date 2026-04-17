import { useMovies } from '../hooks/useMovie'
import { MovieContext } from '../hooks/useMovieContext'

export const MovieProvider = ({ children }) => {
  const { movies, conversionProgress, baseUrl } = useMovies()

  return (
    <MovieContext.Provider value={{ movies, conversionProgress, baseUrl }}>
      {children}
    </MovieContext.Provider>
  )
}