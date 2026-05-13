import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

import { getPlayback, postPlayback } from '../../services/playback'

const VideoPlayer = ({ movie, baseUrl, theme, user }) => {
  const videoRef = useRef(null)

  useEffect(() => {
    const findPlayback = async () => {
      if (user && movie) {
        const userId = user._id
        const movieId = movie._id

        const data = await getPlayback(baseUrl, userId, movieId)
        if (data && data.timing > 0) {
          videoRef.current.currentTime = data.timing
        }
      }
    }
    findPlayback()
  }, [movie, user, baseUrl])

  const saveProgress = async () => {
    if (!videoRef.current || !user || !movie) return

    const payload = {
      userId: user._id,
      movieId: movie._id,
      timing: Math.floor(videoRef.current.currentTime)
    }

    await postPlayback(baseUrl, payload)
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