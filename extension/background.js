// Blinky Extension — background.js (Service Worker)
// Handles API calls on behalf of the popup (avoids CORS issues in MV3)

const API_URL = 'http://localhost:8000' // Update to Fly.io URL for production

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'API_REQUEST') {
    handleApiRequest(message).then(sendResponse).catch(err => {
      sendResponse({ error: err.message || 'Unknown error' })
    })
    return true // keep channel open for async
  }
})

async function handleApiRequest({ method, path, body }) {
  const { blinky_token } = await chrome.storage.local.get('blinky_token')

  const headers = { 'Content-Type': 'application/json' }
  if (blinky_token) headers['Authorization'] = `Bearer ${blinky_token}`

  const config = { method, headers }
  if (body) config.body = JSON.stringify(body)

  const res = await fetch(`${API_URL}${path}`, config)

  if (res.status === 401) {
    await chrome.storage.local.remove('blinky_token')
    return { error: 'Session expired. Please sign in again.' }
  }

  if (res.status === 204) return { data: null }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'API Error' }))
    return { error: err.detail || 'API Error' }
  }

  const data = await res.json()
  return { data }
}
