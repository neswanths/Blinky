import client from './client'

export interface User {
  id: number
  email: string
  name: string
  avatar_url: string
  created_at: string
}

export interface Bookmark {
  id: number
  url: string
  title: string
  position: number
}

export interface Domain {
  id: number
  name: string
  position: number
  bookmarks: Bookmark[]
}

// --- Auth ---
export const getMe = async (): Promise<User> => {
  const res = await client.get('/auth/me')
  return res.data
}

// --- Domains ---
export const getDomains = async (): Promise<Domain[]> => {
  const res = await client.get('/domains')
  return res.data
}

export const createDomain = async (name: string): Promise<Domain> => {
  const res = await client.post('/domains', { name })
  return res.data
}

export const updateDomain = async (id: number, name: string): Promise<Domain> => {
  const res = await client.patch(`/domains/${id}`, { name })
  return res.data
}

export const deleteDomain = async (id: number): Promise<void> => {
  await client.delete(`/domains/${id}`)
}

// --- Bookmarks ---
export const createBookmark = async (
  url: string,
  title: string,
  domainId: number
): Promise<Bookmark> => {
  const res = await client.post('/bookmarks', { url, title, domain_id: domainId })
  return res.data
}

export const updateBookmark = async (id: number, title: string): Promise<Bookmark> => {
  const res = await client.patch(`/bookmarks/${id}`, { title })
  return res.data
}

export const moveBookmark = async (
  bookmarkId: number,
  domainId: number,
  position?: number
): Promise<Bookmark> => {
  const res = await client.patch(`/bookmarks/${bookmarkId}/move`, {
    domain_id: domainId,
    position,
  })
  return res.data
}

export const deleteBookmark = async (id: number): Promise<void> => {
  await client.delete(`/bookmarks/${id}`)
}
