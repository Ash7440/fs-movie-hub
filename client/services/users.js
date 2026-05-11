export const fetchUsers = async (baseUrl) => {
  const response = await fetch(`${baseUrl}/api/users`)

  if (!response.ok) throw new Error('Failed to fetch users')

  return await response.json()
}

export const registerUser = async (baseUrl, data) => {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) throw new Error('Failed to register user')

  return await response.json()
}