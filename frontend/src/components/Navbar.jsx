import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="navbar">
      <div><strong>School Mgmt</strong></div>
      <div>
        {!token
          ? <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          : <button onClick={logout} style={{background:'#dc3545'}}>Cerrar Sesión</button>
        }
      </div>
    </div>
  )
}
