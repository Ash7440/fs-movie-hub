import { createContext, useContext } from 'react'
import { useMovies } from '../hooks/useMovie'

const MovieContext = createContext()

export const MovieProvider = ({ children }) => {
  const { movies, conversionProgress, baseUrl } = useMovies()

  return (
    <MovieContext.Provider value={{ movies, conversionProgress, baseUrl }}>
      {children}
    </MovieContext.Provider>
  )
}

export const useMovieContext = () => {
  return useContext(MovieContext)
}