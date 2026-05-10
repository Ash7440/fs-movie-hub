import React, { useEffect } from 'react'
import UserList from './userList'

const UserSelectorModal = ({ onSelectUser }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <UserList onSelectUser={onSelectUser} />
      </div>
    </div>
  )
}

export default UserSelectorModal