import React, { useState } from 'react'
import { loginUser } from '../../services/users'

const LoginForm = ({ baseUrl, user, onCancel, onSuccess }) => {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(false)
    setError('')

    try {
      const authenticatedUser = await loginUser(baseUrl, {
        username: user.username,
        password
      })
      onSuccess(authenticatedUser)
    } catch {
      setError('Неверный пароль. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-form" style={{ textAlign: 'center', color: 'white' }}>
      <h2>Вход в профиль</h2>
      <div style={{ marginBottom: '20px' }}>
        <img 
          src={`${baseUrl}${user.avatarPath}`} 
          alt={user.username} 
          style={{ width: '100px', height: '100px', borderRadius: '8px', border: '2px solid white' }}
        />
        <h3 style={{ marginTop: '10px' }}>{user.username}</h3>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto' }}>
        <input 
          type="password" 
          placeholder="Введите пароль" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          style={inputStyle}
        />
        
        {error && <p style={{ color: '#ff4d4d', fontSize: '0.9rem', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={loading} style={btnStyle(true)}>
            {loading ? 'Проверка...' : 'Войти'}
          </button>
          <button type="button" onClick={onCancel} style={btnStyle(false)}>Назад</button>
        </div>
      </form>
    </div>
  )
}

const inputStyle = { padding: '12px', borderRadius: '4px', border: '1px solid #333', background: '#111', color: 'white', textAlign: 'center' }
const btnStyle = (isPrimary) => ({
  flex: 1, padding: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer',
  background: isPrimary ? '#e50914' : '#333', color: 'white', fontWeight: 'bold'
})

export default LoginForm