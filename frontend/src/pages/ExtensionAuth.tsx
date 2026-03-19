/**
 * ExtensionAuth page — used by the Chrome extension to get a JWT
 * The extension opens this page, reads the JWT from localStorage,
 * and receives it via chrome.runtime.sendMessage
 */
export default function ExtensionAuth() {
  const token = localStorage.getItem('blinky_token')

  const handleConnect = () => {
    if (token) {
      // Post message to the extension's injected content script
      window.postMessage({ type: 'BLINKY_TOKEN', token }, '*')
    }
  }

  return (
    <div className="loading-screen" style={{ flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontWeight: 700 }}>Connect Chrome Extension</h2>
      {token ? (
        <>
          <p style={{ color: 'var(--muted)' }}>You're signed in. Click below to authorize the extension.</p>
          <button className="btn-primary" onClick={handleConnect} id="ext-connect-btn">
            Authorize Extension
          </button>
        </>
      ) : (
        <p style={{ color: 'var(--muted)' }}>Please sign in to Blinky first, then come back here.</p>
      )}
    </div>
  )
}
