import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMovieContext } from '../hooks/useMovieContext'

import { getPlayback, postPlayback } from '../../services/playback'

const VideoPlayer = ({ theme, user }) => {
  const [prevTiming, setPrevTiming] = useState(0)
  const { filename } = useParams()
  const { movies, baseUrl } = useMovieContext()
  const videoRef = useRef(null)

  const movie = movies.find(m => m.playFile === filename)

  useEffect(() => {
    const findPlayback = async () => {
    if (user.user.isGuest || !movie) return
    
    if (user && movie) {
      const token = user.token
      const movieId = movie.id
      const data = await getPlayback(baseUrl, token, movieId)
      if (data && data.timing > 0) {
        videoRef.current.currentTime = data.timing
      }
    }
  }
    findPlayback()
  }, [movie, user, baseUrl])

  const saveProgress = async () => {
    if (!videoRef.current || user.user.isGuest || !movie) return

    const token = user.token

    const timing = Math.floor(videoRef.current.currentTime)

    const payload = {
      userId: user.user.id,
      movieId: movie.id,
      timing: timing
    }

    setPrevTiming(timing)
    if (timing === prevTiming) return

    await postPlayback(baseUrl, token, payload)
  }

  useEffect(() => {
    const interval = setInterval(saveProgress, 15000)
    return () => {
      clearInterval(interval)
      saveProgress()
    }
  }, [])

  if (!movie) return <div style={{color: 'white', textAlign: 'center', padding: '50px'}}>Загрузка...</div>

  const url = `${baseUrl}/api/movies/${movie.playFile}`
  
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
        <video
          key={movie.id}
          width='100%'
          controls
          autoPlay
          ref={videoRef}
          onPause={saveProgress}
        >
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

export default VideoPlayer