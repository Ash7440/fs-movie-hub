import MovieCard from './MovieCard'

const MovieGallery = ({ movies }) => {

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
        <MovieCard key={movie.fileName} movie={movie} />
      )}
    </div>
  )
}

export default MovieGallery