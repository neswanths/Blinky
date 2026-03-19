import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('blinky_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear token and reload
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('blinky_token')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default client

export const API_BASE = API_URL
