const baseUrl = 'http://localhost:3001/api/movies'

const deleteMovie = async (id) => {
  const response = await fetch(`${baseUrl}/${id}`, {
    method: 'DELETE'
  })

  if (!response.ok) throw new Error('Failed to remove movie')

  return response
}

export default deleteMovie