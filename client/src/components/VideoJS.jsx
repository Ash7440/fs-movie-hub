import React, { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

export const VideoJS = ({ options, onReady }) => {
  const videoRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement('video-js')
      videoElement.classList.add('vjs-big-play-centered')
      videoRef.current.appendChild(videoElement)

      const player = (playerRef.current = videojs(videoElement, options, () => {
        if (onReady) {
          onReady(player)
        }
      }));
    } else {
      const player = playerRef.current
      
      const currentSrc = player.src()
      const newSrc = options.sources?.[0]?.src

      if (newSrc && currentSrc !== newSrc) {
        player.src(options.sources)
      }
      
      player.autoplay(options.autoplay)
    }
  }, [options, onReady])

  useEffect(() => {
    const player = playerRef.current
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [])

  return (
    <div data-vjs-player style={{ width: '100%' }}>
      <div ref={videoRef} />
    </div>
  )
}

export default VideoJS