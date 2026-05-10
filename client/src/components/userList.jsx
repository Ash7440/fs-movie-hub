import { useState, useEffect } from 'react'
import fetchUsers from '../../services/users'
import './UserList.css'
import { useMovieContext } from '../hooks/useMovieContext'

const UserList = ({ onSelectUser }) => {
  const [users, setUsers] = useState([])

  const { baseUrl } = useMovieContext()

  useEffect(() => {
    const getUsers = async () => {
      const usersArr = await fetchUsers(baseUrl)

      if (!usersArr) return

      setUsers(usersArr)
    }
    getUsers()
  }, [baseUrl])

  return (
    <div className='user-selector-container'>
      <h2>Кто смотрит?</h2>
      <div className='user-grid'>
        {users.map(user => (
          <div
            key={user._id}
            className='user-card'
            onClick={() => onSelectUser(user)}
          >
            <img
              src={`${baseUrl}${user.avatarPath}`}
              alt={user.username}
              className='user-avatar'  
            />
            <span className='user-name'>{user.username}</span>
          </div>
        ))}
      </div>
    </div>
  )  
}

export default UserList