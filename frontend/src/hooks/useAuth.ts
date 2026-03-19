import { useState, useEffect } from 'react'
import { getMe, User } from '../api/bookmarks'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('blinky_token')

  useEffect(() => {
    // Send to extension whenever token is available
    if (token) {
      window.postMessage({ type: 'BLINKY_TOKEN', token }, '*')
    } else {
      window.postMessage({ type: 'BLINKY_TOKEN', token: null }, '*')
    }

    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('blinky_token')
        window.postMessage({ type: 'BLINKY_TOKEN', token: null }, '*')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const logout = () => {
    localStorage.removeItem('blinky_token')
    window.postMessage({ type: 'BLINKY_TOKEN', token: null }, '*')
    window.location.href = '/'
  }

  return { user, loading, isLoggedIn: !!user, logout }
}
