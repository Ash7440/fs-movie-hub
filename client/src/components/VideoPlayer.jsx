import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMovieContext } from '../hooks/useMovieContext'
import { getPlayback, postPlayback } from '../../services/playback'
import VideoJS from './VideoJS'

const VideoPlayer = ({ theme, user }) => {
  const [prevTiming, setPrevTiming] = useState(0)
  const { filename } = useParams()
  const { movies, baseUrl } = useMovieContext()

  const playerRef = useRef(null) 

  const movie = movies.find(m => m.playFile === filename)

  const saveProgress = async () => {
    const player = playerRef.current
    if (!player || user.user.isGuest || !movie) return

    if (player.readyState() === 0) return

    const token = user.token
    const timing = Math.floor(playerRef.current.currentTime())

    if (timing === 0 && prevTiming === 0) return

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
  }, [movie, user, prevTiming])

  if (!movie) return <div style={{color: 'white', textAlign: 'center', padding: '50px'}}>Загрузка...</div>

  const url = `${baseUrl}/api/movies/${movie.playFile}/index.m3u8`
  
  // Конфиг для Video.js
  const videoJsOptions = useMemo(() => {
    const isSmartTV = /Tizen|Web0S|WebOS|SmartTV/i.test(navigator.userAgent)
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const useNative = isSmartTV || isApple

    const options = {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      controlBar: {
        audioTrackButton: true
      },
      sources: [{
        src: url,
        type: 'application/x-mpegURL'
      }]
    }

    if (useNative) {
      options.html5 = {
        vhs: { overrideNative: false },
        nativeAudioTracks: true,
        nativeVideoTracks: true
      }
    }

    return options
  }, [url])

  const handlePlayerReady = async (player) => {
    playerRef.current = player

    player.on('pause', saveProgress)

    if (!user.user.isGuest && user && movie) {
      const token = user.token
      const movieId = movie.id
      const data = await getPlayback(baseUrl, token, movieId)
      if (data && data.timing > 0) {
        player.currentTime(data.timing)
      }
    }
  }

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
        <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />
      </div>
      <div style={styles.details}>
        <h1 style={styles.title}>{movie.title}</h1>
        <p style={styles.overview}>{movie.overview || 'Описание отсутствует.'}</p>
      </div>
    </div>
  )
}

export default VideoPlayer