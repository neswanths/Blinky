// Blinky Extension Content Script
// Injected into the frontend web application to listen for authentication tokens

window.addEventListener('message', async (event) => {
  // Security check: only accept messages from the window where this script is injected
  if (event.source !== window) return
  
  if (event.data?.type === 'BLINKY_TOKEN') {
    try {
      if (event.data.token) {
        await chrome.storage.local.set({ blinky_token: event.data.token })
        console.log('[Blinky Extension] Successfully captured and stored auth token.')
        
        const btn = document.getElementById('ext-connect-btn')
        if (btn) {
          btn.textContent = 'Chrome Connected! You can close this tab.'
          btn.disabled = true
          btn.style.backgroundColor = '#10b981' // Success green
        }
      } else {
        await chrome.storage.local.remove('blinky_token')
        console.log('[Blinky Extension] Successfully removed auth token.')
      }
    } catch (e) {
      console.error('[Blinky Extension] Error storing token:', e)
    }
  }
})
