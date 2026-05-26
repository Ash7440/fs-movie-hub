import React, { useState, useEffect } from 'react'
import UserList from './userList'
import RegisterForm from './RegisterForm'
import LoginForm from './LoginForm'
import { useMovieContext } from '../hooks/useMovieContext'
import { loginUser } from '../../services/users'

const UserSelectorModal = ({ onSelectUser, onSelectGuest }) => {
  const { baseUrl } = useMovieContext()
  const [step, setStep] = useState('list')
  const [userToLogin, setUserToLogin] = useState(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => { document.body.style.overflow = 'unset' }
  }, [])

  const handleUserClick = async (user) => {
    if (user.hasPassword) {
      setUserToLogin(user)
      setStep('password')
    } else {
      const userWithToken = await loginUser(baseUrl, {
        username: user.username,
        password: ''
      })
      onSelectUser(userWithToken)
    }
  }

  const refreshList = () => {
    setStep('list')
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {step === 'register' && (
          <RegisterForm 
            baseUrl={baseUrl} 
            onCancel={() => setStep('list')} 
            onSuccess={refreshList}
          />
        )}

        {step === 'password' && (
          <LoginForm 
            baseUrl={baseUrl} 
            user={userToLogin}
            onCancel={() => {
              setStep('list')
              setUserToLogin(null)
            }}
            onSuccess={onSelectUser}
          />
        )}

        {step === 'list' && (
          <UserList 
            onSelectUser={handleUserClick}
            onSelectGuest={onSelectGuest}
            onAddClick={() => setStep('register')} 
          />
        )}
      </div>
    </div>
  )
}

export default UserSelectorModal