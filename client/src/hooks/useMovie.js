import { useState, useEffect, useCallback } from 'react'

const baseUrl = import.meta.env.MODE === 'development'
  ? 'http://localhost:3001'
  : window.location.origin

export const useMovies = () => {
  const [movies, setMovies] = useState([])
  const [conversionProgress, setConversionProgress] = useState({})

  const fetchMovies = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/movies`)
      if (!response.ok) throw new Error('Unable to fetch data')
      const data = await response.json()
      setMovies(data)
      console.log('Список фильмов успешно обновлен:', data.length, 'шт.')
    } catch (err) {
      console.error('Ошибка загрузки фильмов:', err)
    }
  }, [])
  
  useEffect(() => {
    fetchMovies()

    const eventSource = new EventSource(`${baseUrl}/api/movies/status`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE Update:', data)

        if (data.type === 'NEW_MOVIE_DETECTED' || data.status === 'done') {
          console.log('Пойман сигнал о новом фильме! Перезапрашиваем...')
           fetchMovies()
        }

        if (data.fileName) {
            setConversionProgress(prev => ({
              ...prev,
              [data.fileName]: data.percent
            }))
        }
      } catch (err) {
        console.error('Failed to parse SSE:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE error', err)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [fetchMovies])
    
  return { movies, conversionProgress, baseUrl }
}