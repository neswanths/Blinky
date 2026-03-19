import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * This page is hit after Google OAuth completes.
 * The backend redirects here with ?token=<jwt>
 * We store the token and redirect to home.
 */
export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      localStorage.setItem('blinky_token', token)
      navigate('/', { replace: true })
    } else {
      // No token, something went wrong
      navigate('/?auth_error=1', { replace: true })
    }
  }, [navigate])

  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ marginTop: 20, color: 'var(--muted)' }}>Signing you in…</p>
    </div>
  )
}
