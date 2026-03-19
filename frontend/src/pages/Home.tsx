import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBookmarks } from '../hooks/useBookmarks'
import SectionGrid from '../components/SectionGrid'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import DemoModal from '../components/DemoModal'

export default function Home() {
  const [showFirstSectionModal, setShowFirstSectionModal] = useState(false)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [showExtensionModal, setShowExtensionModal] = useState(false)
  const { user, loading: authLoading, isLoggedIn, logout } = useAuth()
  const {
    domains,
    loading,
    addDomain,
    renameDomain,
    removeDomain,
    addBookmark,
    renameBookmark,
    moveBookmark,
    removeBookmark,
  } = useBookmarks(isLoggedIn)

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={logout} />

      <main className="main-content">
        {!isLoggedIn ? (
          // --- Landing / not logged in ---
          <div className="landing">
            <div className="landing-hero">
              <div className="landing-dot">●</div>
              <h1 className="landing-title">Blinky</h1>
              <p className="landing-sub">
                Your bookmarks. Organized. Minimal. Always there.
              </p>
              <button 
                className="btn-primary" 
                style={{ padding: '12px 32px', fontSize: '1.1rem', borderRadius: 'var(--radius-md)' }}
                onClick={() => setShowDemoModal(true)}
              >
                Get Started
              </button>
              <p className="landing-note">No mess. No friction.</p>
            </div>

            <div className="landing-features">
              <div className="feature-pill">⌗ Group by section</div>
              <div className="feature-pill">⠿ Drag &amp; drop</div>
              <div className="feature-pill" style={{ cursor: 'pointer' }} onClick={() => setShowExtensionModal(true)}>
                ⚡ Chrome extension
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="loading-screen">
            <div className="spinner" />
          </div>
        ) : domains.length === 0 ? (
          // --- Empty state ---
          <div className="empty-state">
            <div className="empty-icon">⌗</div>
            <h2>Let's get organized</h2>
            <p>Create your first section to start saving links.</p>
            <button
              className="btn-primary"
              onClick={() => setShowFirstSectionModal(true)}
            >
              + Create first section
            </button>
          </div>
        ) : (
          // --- Main bookmark manager ---
          <SectionGrid
            domains={domains}
            onAddDomain={addDomain}
            onRenameDomain={renameDomain}
            onDeleteDomain={removeDomain}
            onAddBookmark={addBookmark}
            onRenameBookmark={renameBookmark}
            onMoveBookmark={moveBookmark}
            onDeleteBookmark={removeBookmark}
          />
        )}
      </main>

      <Modal
        isOpen={showFirstSectionModal}
        title="New Section"
        desc="Create your first category for your bookmarks."
        inputs={[{ type: 'text', placeholder: 'e.g., AI Tools, Research, Projects', id: 'name' }]}
        confirmText="Create"
        onConfirm={async (vals) => {
          const name = vals['name'].trim()
          if (!name) return false
          await addDomain(name)
          setShowFirstSectionModal(false)
        }}
        onClose={() => setShowFirstSectionModal(false)}
      />

      <DemoModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)} 
      />

      <Modal
        isOpen={showExtensionModal}
        title="Install Extension"
        desc="Blinky is not yet on the Chrome Web Store. Follow these steps to install it manually:"
        confirmText="Download .zip"
        onConfirm={() => {
          window.location.href = '/extension.zip'
          return false
        }}
        onClose={() => setShowExtensionModal(false)}
      >
        <div style={{ textAlign: 'left', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <ol style={{ paddingLeft: '1.2rem', lineHeight: '1.6' }}>
            <li>Download and extract the <strong>extension.zip</strong> file.</li>
            <li>Open Chrome and go to <code>chrome://extensions/</code></li>
            <li>Enable <strong>Developer mode</strong> in the top right.</li>
            <li>Click <strong>Load unpacked</strong> and select the extracted folder.</li>
          </ol>
        </div>
      </Modal>
    </div>
  )
}
