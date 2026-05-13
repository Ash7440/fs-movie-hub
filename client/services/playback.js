export const getPlayback = async (baseUrl, userId, movieId) => {
  const response = await fetch(`${baseUrl}/api/playback/${userId}/${movieId}`)

  if (!response.ok) throw new Error('Failed to get playback')

  return await response.json()
}

export const postPlayback = async (baseUrl, data) => {
  const response = await fetch(`${baseUrl}/api/playback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) throw new Error('Failed to post playback')

  return await response.json()
}