import React, { useState } from 'react'
import { registerUser } from '../../services/users'

const RegisterForm = ({ baseUrl, onCancel, onSuccess }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await registerUser(baseUrl, { username, password })
      onSuccess()
    } catch (err) {
      alert('Ошибка: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-form">
      <h2 style={{ color: 'white' }}>Новый профиль</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Имя пользователя" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={inputStyle}
        />
        <input 
          type="password" 
          placeholder="Пароль" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={loading} style={btnStyle(true)}>
            {loading ? 'Создание...' : 'Создать'}
          </button>
          <button type="button" onClick={onCancel} style={btnStyle(false)}>Отмена</button>
        </div>
      </form>
    </div>
  )
}

// Стили
const inputStyle = { padding: '12px', borderRadius: '4px', border: '1px solid #333', background: '#111', color: 'white' }
const btnStyle = (isPrimary) => ({
  flex: 1, padding: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer',
  background: isPrimary ? '#e50914' : '#333', color: 'white', fontWeight: 'bold'
})

export default RegisterForm