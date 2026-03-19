// Blinky Extension — popup.js
// All API calls go through background.js service worker

const API_URL = 'http://localhost:8000' // Will be updated to Fly.io URL in production
const WEBAPP_URL = 'http://localhost:5173' // Will be updated to Vercel URL in production

let activeBookmarkId = null;
let currentTab = null;

// --- Helpers ---
function show(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'))
  document.getElementById(id).classList.remove('hidden')
}

function getFavicon(url) {
  try {
    const { hostname } = new URL(url.startsWith('http') ? url : `https://${url}`)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch { return '' }
}

function setStatus(msg, type = '') {
  const el = document.getElementById('save-status')
  el.textContent = msg
  el.className = `save-status ${type}`
  el.classList.remove('hidden')
  if (type === 'success') setTimeout(() => el.classList.add('hidden'), 2500)
}

// --- API calls via background service worker ---
async function apiRequest(method, path, body = null) {
  const result = await chrome.runtime.sendMessage({
    type: 'API_REQUEST',
    method,
    path,
    body,
  })
  if (result.error) throw new Error(result.error)
  return result.data
}

// --- Init ---
async function init() {
  show('view-loading')

  const { blinky_token } = await chrome.storage.local.get('blinky_token')

  if (!blinky_token) {
    show('view-not-signed-in')
    document.getElementById('btn-signin').addEventListener('click', () => {
      chrome.tabs.create({ url: `${WEBAPP_URL}/extension-auth` })
    })
    return
  }

  show('view-main')

  try {
    const me = await apiRequest('GET', '/users/me')
    const userInfo = document.getElementById('user-info')
    if (userInfo && me && me.name) {
      userInfo.textContent = me.name.split(' ')[0]
      userInfo.classList.remove('hidden')
    }
  } catch (e) {
    console.error('Failed to get user info', e)
  }

  // Set webapp link
  document.getElementById('open-webapp').href = WEBAPP_URL

  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab) {
    currentTab = tab
    const favicon = getFavicon(tab.url)
    const faviconEl = document.getElementById('tab-favicon')
    if (favicon) {
      faviconEl.src = favicon
      faviconEl.onerror = () => { faviconEl.style.display = 'none' }
    } else {
      faviconEl.style.display = 'none'
    }
    document.getElementById('tab-title').textContent = tab.title || tab.url
  }

  // Load domains
  try {
    const domains = await apiRequest('GET', '/domains')
    const select = document.getElementById('section-select')
    
    let generalDomain = domains.find(d => d.name.toLowerCase() === 'general')
    if (!generalDomain) {
      try {
        generalDomain = await apiRequest('POST', '/domains', { name: 'General' })
        domains.unshift(generalDomain) // place it first
      } catch (err) {
        console.error('Failed to create General section', err)
      }
    }

    // Build options
    domains.forEach(d => {
      const opt = document.createElement('option')
      opt.value = d.id
      opt.textContent = d.name
      select.appendChild(opt)
    })
    
    // Add "New section" option
    const newOpt = document.createElement('option')
    newOpt.value = 'NEW_SECTION'
    newOpt.textContent = '+ Create new section...'
    select.appendChild(newOpt)

    let targetDomainId = generalDomain ? generalDomain.id : (domains.length > 0 ? domains[0].id : null)

    const saveLabel = document.getElementById('save-label')
    const pickerContainer = document.getElementById('section-picker-container')
    const inputContainer = document.getElementById('new-section-input')
    const btnSave = document.getElementById('btn-save')

    // Start Add workflow (Manual)
    if (targetDomainId) {
      select.value = targetDomainId
      pickerContainer.classList.remove('hidden')
      btnSave.classList.remove('hidden')
    } else {
      // User has no domains! Prompt them.
      saveLabel.textContent = 'Create:'
      pickerContainer.classList.remove('hidden')
      select.classList.add('hidden')
      inputContainer.classList.remove('hidden')
      inputContainer.focus()
    }

    // Save Button Click
    btnSave.addEventListener('click', async () => {
      if (!activeBookmarkId) {
        btnSave.disabled = true
        btnSave.textContent = '...'
        await performSave(currentTab, targetDomainId)
        btnSave.textContent = 'Saved'
      }
    })

    // Handle Dropdown Change (Move or Create)
    select.addEventListener('change', async () => {
      if (select.value === 'NEW_SECTION') {
        select.classList.add('hidden')
        inputContainer.classList.remove('hidden')
        inputContainer.focus()
      } else {
        targetDomainId = parseInt(select.value)
        if (activeBookmarkId) {
          saveLabel.textContent = 'Moving...'
          select.disabled = true
          await apiRequest('PATCH', `/bookmarks/${activeBookmarkId}/move`, { domain_id: targetDomainId })
          saveLabel.textContent = 'Section:'
          select.disabled = false
          setStatus('Moved! ✓', 'success')
        } else {
          // just updated targetDomainId, waiting for Save click
        }
      }
    })

    // Handle text input (Create new section)
    inputContainer.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const name = inputContainer.value.trim()
        if (!name) {
          // Ignore and close
          inputContainer.classList.add('hidden')
          select.classList.remove('hidden')
          select.value = targetDomainId || (domains.length > 0 ? domains[0].id : '')
          return
        }

        inputContainer.disabled = true
        saveLabel.textContent = 'Creating...'
        try {
          const newDomain = await apiRequest('POST', '/domains', { name })
          
          // Add to select list right above the NEW_SECTION button
          const opt = document.createElement('option')
          opt.value = newDomain.id
          opt.textContent = newDomain.name
          select.insertBefore(opt, select.lastElementChild)
          
          targetDomainId = newDomain.id
          select.value = targetDomainId

          // Hide input
          inputContainer.classList.add('hidden')
          inputContainer.disabled = false
          inputContainer.value = ''
          select.classList.remove('hidden')

          if (activeBookmarkId) {
            saveLabel.textContent = 'Moving...'
            select.disabled = true
            await apiRequest('PATCH', `/bookmarks/${activeBookmarkId}/move`, { domain_id: targetDomainId })
            saveLabel.textContent = 'Section:'
            select.disabled = false
            setStatus('Moved to new section! ✓', 'success')
          } else {
            // just updated targetDomainId, wait for save
            btnSave.classList.remove('hidden')
          }

        } catch (err) {
          setStatus(`Error: ${err.message}`, 'error')
          inputContainer.disabled = false
        }
      } else if (e.key === 'Escape') {
        inputContainer.classList.add('hidden')
        inputContainer.value = ''
        select.classList.remove('hidden')
        select.value = targetDomainId || ''
      }
    })

    // Load recent bookmarks
    const allBookmarks = domains
      .flatMap(d => d.bookmarks.map(b => ({ ...b, sectionName: d.name })))
      .sort((a, b) => b.id - a.id)
      .slice(0, 5)

    renderRecents(allBookmarks)
  } catch (e) {
    console.error('Failed to load domains:', e)
  }

  // Sign out
  document.getElementById('btn-signout').addEventListener('click', async () => {
    await chrome.storage.local.remove('blinky_token')
    show('view-not-signed-in')
  })
}

// Executes the instant save logic
async function performSave(tab, domainId) {
  if (!tab || !domainId) return
  const saveLabel = document.getElementById('save-label')
  const select = document.getElementById('section-select')
  
  saveLabel.textContent = 'Saving...'
  select.disabled = true
  
  try {
    let rawUrl = tab.url
    if (!rawUrl.match(/^https?:\/\//)) rawUrl = `https://${rawUrl}`
    const title = tab.title || new URL(rawUrl).hostname.replace('www.', '').split('.')[0]

    const bookmark = await apiRequest('POST', '/bookmarks', { url: rawUrl, title, domain_id: domainId })
    activeBookmarkId = bookmark.id
    
    saveLabel.textContent = 'Section:'
    select.disabled = false
    setStatus('Saved! ✓', 'success')
  } catch (err) {
    saveLabel.textContent = 'Error'
    select.disabled = false
    setStatus(`Error: ${err.message}`, 'error')
  }
}

function renderRecents(bookmarks) {
  const list = document.getElementById('recents-list')
  if (!bookmarks.length) {
    list.innerHTML = '<li class="recents-loading">No bookmarks yet</li>'
    return
  }

  list.innerHTML = ''
  bookmarks.forEach(b => {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = b.url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'

    const img = document.createElement('img')
    img.src = getFavicon(b.url)
    img.onerror = () => { img.style.display = 'none' }

    const span = document.createElement('span')
    span.textContent = b.title

    a.append(img, span)
    li.appendChild(a)
    list.appendChild(li)
  })
}

document.addEventListener('DOMContentLoaded', init)
