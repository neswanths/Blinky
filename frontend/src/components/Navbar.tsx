import { useState, useRef, useEffect } from 'react'
import { API_BASE } from '../api/client'
import { User } from '../api/bookmarks'

interface Props {
  user: User | null
  onLogout: () => void
}

export default function Navbar({ user, onLogout }: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-dot">●</span>
        <span className="brand-name">Blinky</span>
      </div>

      <div className="navbar-right">
        <a href="/extension.zip" download className="navbar-link" style={{ marginRight: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Extension
        </a>
        {user ? (
          <div className="user-menu" style={{ position: 'relative' }} ref={menuRef}>
            <button className="user-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <img
                src={user.avatar_url || ''}
                alt={user.name}
                className="user-avatar"
                onError={e => {
                  const el = e.target as HTMLImageElement
                  el.style.display = 'none'
                }}
              />
              <span className="user-name">{user.name.split(' ')[0]}</span>
            </button>
            <div 
              className="dropdown-menu" 
              style={isDropdownOpen ? { opacity: 1, visibility: 'visible', pointerEvents: 'auto', top: 'calc(100% + 4px)' } : {}}
            >
              <a href={`${API_BASE}/auth/google`} className="dropdown-item">Change Account</a>
              <button onClick={onLogout} className="dropdown-item dropdown-item-danger">
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <a href={`${API_BASE}/auth/google`} className="btn-google">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.169 6.656 3.58 9 3.58z"/>
            </svg>
            Sign in with Google
          </a>
        )}
      </div>
    </nav>
  )
}
