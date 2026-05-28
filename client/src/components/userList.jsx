import { useState, useEffect } from 'react'
import { fetchUsers } from '../../services/users'
import './UserList.css'
import { useMovieContext } from '../hooks/useMovieContext'

const UserList = ({ onSelectUser, onSelectGuest, onAddClick }) => {
  const [users, setUsers] = useState([])

  const { baseUrl } = useMovieContext()

  useEffect(() => {
    const getUsers = async () => {
      const cachedUsers = localStorage.getItem('cinema_users_list')
      if (cachedUsers) {
        setUsers(JSON.parse(cachedUsers))
      }

      try {
        const usersArr = await fetchUsers(baseUrl)
        if (usersArr) {
          setUsers(usersArr)
          localStorage.setItem('cinema_users_list', JSON.stringify(usersArr))
        }
      } catch (err) {
        console.error('Error during background user loading', err)
      }
    }
    getUsers()
  }, [baseUrl])

  return (
    <div className='user-selector-container'>
      <h2>Кто смотрит?</h2>
      <div className='user-grid'>
        {users.map(user => (
          <div
            key={user.id}
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

        <div className='user-card guest-card' onClick={onSelectGuest}>
          <img
            src={`${baseUrl}/avatars/Guest_avatar.svg`}
            alt='Guest'
            className='user-avatar'  
          />
          <span className='user-name'>Войти как гость</span>
        </div>

        <div className='user-card add-user' onClick={onAddClick}>
          <div className='avatar-placeholder'>
            <span style={{ fontSize: '3rem' }}>+</span>
          </div>
          <span className='user-name'>Добавить</span>
        </div>
      </div>
    </div>
  )  
}

export default UserList