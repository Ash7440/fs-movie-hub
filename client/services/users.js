const fetchUsers = async (baseUrl) => {
  const response = await fetch(`${baseUrl}/api/users`)

  if (!response.ok) throw new Error('Failed to fetch users')

  return await response.json()
}

export default fetchUsers