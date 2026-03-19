import { useState } from 'react'
import { API_BASE } from '../api/client'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function DemoModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<number>(0)

  if (!isOpen) return null

  const handleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
        {step === 0 && (
          <>
            <h3 className="modal-title">Welcome to Blinky</h3>
            <p className="modal-desc">Would you like a quick tour before signing in?</p>
            <div className="modal-actions" style={{ flexDirection: 'column' }}>
              <button className="btn-primary" onClick={() => setStep(1)} style={{ width: '100%', marginBottom: 8, padding: '12px' }}>
                Show Demo
              </button>
              <button className="btn-secondary" onClick={handleLogin} style={{ width: '100%', padding: '12px' }}>
                Skip Demo & Log In
              </button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--text)' }}>⌗</div>
            <h3 className="modal-title">Group by Section</h3>
            <p className="modal-desc">Create custom sections to keep your bookmarks perfectly organized.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setStep(0)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(2)}>Next</button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--text)' }}>⠿</div>
            <h3 className="modal-title">Drag & Drop</h3>
            <p className="modal-desc">Effortlessly reorder links or move them between sections.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" onClick={() => setStep(3)}>Next</button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--text)' }}>⚡</div>
            <h3 className="modal-title">Chrome Extension</h3>
            <p className="modal-desc">Save any page with one click directly from our browser extension.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary" onClick={handleLogin}>Sign in</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
