import React, { useState, useEffect } from 'react'
import UserList from './userList'
import RegisterForm from './RegisterForm'
import { useMovieContext } from '../hooks/useMovieContext'

const UserSelectorModal = ({ onSelectUser }) => {
  const { baseUrl } = useMovieContext()
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const refreshList = () => {
    setIsRegistering(false)
    window.location.reload()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {isRegistering ? (
          <RegisterForm 
            baseUrl={baseUrl} 
            onCancel={() => setIsRegistering(false)} 
            onSuccess={refreshList}
          />
        ) : (
          <UserList 
            onSelectUser={onSelectUser} 
            onAddClick={() => setIsRegistering(true)} 
          />
        )}
      </div>
    </div>
  )
}

export default UserSelectorModal