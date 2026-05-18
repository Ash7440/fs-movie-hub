import { useState, useEffect } from 'react'
import MovieCard from './MovieCard'
import { useMovieContext } from '../hooks/useMovieContext'
import { getAllUserPlaybacks } from '../../services/playback'

const MovieGallery = ({ movies }) => {
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [userPlaybacks, setUserPlaybacks] = useState([])
  const { baseUrl, fetchMovies } = useMovieContext()

  const currentUser = JSON.parse(localStorage.getItem('cinema_user'))

  useEffect(() => {
    const getPlaybacks = async () => {
      if (!currentUser) return
      
      if (currentUser && currentUser._id) {
        const data = await getAllUserPlaybacks(baseUrl, currentUser._id)
        setUserPlaybacks(data)

        if (!data) return

        if (fetchMovies) {
          fetchMovies()
        }
      }  
    }
    getPlaybacks()
  }, [baseUrl, fetchMovies])

 return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '30px',
      padding: '40px',
      maxWidth: '1300px',
      margin: '0 auto'
    }}>
      
      {movies.map((movie) => 
        <MovieCard 
          key={movie.fileName} 
          movie={movie}
          userPlaybacks={userPlaybacks}
          isMenuOpen={activeMenuId === movie.id}
          onMenuToggle={isOpen => setActiveMenuId(isOpen ? movie.id : null)} 
        />
      )}
    </div>
  )
}

export default MovieGallery