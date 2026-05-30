export const getPlayback = async (baseUrl, token, movieId) => {
  const response = await fetch(`${baseUrl}/api/playback/${movieId}`,{
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) throw new Error('Failed to get playback')

  return await response.json()
}

export const getAllUserPlaybacks = async (baseUrl, token) => {
  const response = await fetch(`${baseUrl}/api/playback/user`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) throw new Error('Failed to get all playbacks')

  return await response.json()
}

let prevTiming = 0

export const postPlayback = async (baseUrl, token, data) => {
  if (data.timing === prevTiming) return

  const response = await fetch(`${baseUrl}/api/playback`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  prevTiming = data.timing
  
  if (!response.ok) throw new Error('Failed to post playback')

  return await response.json()
}