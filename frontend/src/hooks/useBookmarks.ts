import { useState, useEffect, useCallback } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import {
  Domain,
  getDomains,
  createDomain,
  updateDomain,
  deleteDomain,
  createBookmark,
  updateBookmark,
  moveBookmark,
  deleteBookmark,
  moveDomain,
} from '../api/bookmarks'

export function useBookmarks(isLoggedIn: boolean) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getDomains()
      setDomains(data)
    } finally {
      setLoading(false)
    }
  }, [isLoggedIn])

  useEffect(() => { fetchAll() }, [fetchAll])

  // --- Domain actions ---
  const addDomain = async (name: string) => {
    const d = await createDomain(name)
    setDomains(prev => [...prev, d])
    return d
  }

  const renameDomain = async (id: number, name: string) => {
    const updated = await updateDomain(id, name)
    setDomains(prev => prev.map(d => d.id === id ? { ...d, name: updated.name } : d))
  }

  const removeDomain = async (id: number) => {
    await deleteDomain(id)
    setDomains(prev => prev.filter(d => d.id !== id))
  }

  // --- Bookmark actions ---
  const addBookmark = async (url: string, title: string, domainId: number) => {
    const b = await createBookmark(url, title, domainId)
    setDomains(prev =>
      prev.map(d =>
        d.id === domainId ? { ...d, bookmarks: [...d.bookmarks, b] } : d
      )
    )
    return b
  }

  const renameBookmark = async (bookmarkId: number, domainId: number, title: string) => {
    const updated = await updateBookmark(bookmarkId, title)
    setDomains(prev =>
      prev.map(d =>
        d.id === domainId
          ? { ...d, bookmarks: d.bookmarks.map(b => b.id === bookmarkId ? updated : b) }
          : d
      )
    )
  }

  const moveBookmarkAction = async (
    bookmarkId: number,
    fromDomainId: number,
    toDomainId: number,
    position?: number
  ) => {
    // Optimistic update
    setDomains(prev => {
      const bookmark = prev.find(d => d.id === fromDomainId)?.bookmarks.find(b => b.id === bookmarkId)
      if (!bookmark) return prev
      const updatedBookmark = { ...bookmark, domain_id: toDomainId } as any

      return prev.map(d => {
        let newBookmarks = [...d.bookmarks]

        if (fromDomainId === toDomainId) {
          // Same column move
          if (d.id === fromDomainId && position !== undefined) {
            const oldIndex = d.bookmarks.findIndex(b => b.id === bookmarkId)
            newBookmarks = arrayMove(d.bookmarks, oldIndex, position)
          }
        } else {
          // Different column move
          if (d.id === fromDomainId) {
            newBookmarks = newBookmarks.filter(b => b.id !== bookmarkId)
          }
          if (d.id === toDomainId) {
            if (position !== undefined) {
              newBookmarks.splice(position, 0, updatedBookmark)
            } else {
              newBookmarks.push(updatedBookmark)
            }
          }
        }
        
        return { ...d, bookmarks: newBookmarks }
      })
    })
    // Sync with backend
    await moveBookmark(bookmarkId, toDomainId, position)
  }

  const moveDomainAction = async (domainId: number, position: number) => {
    setDomains(prev => {
      const oldIndex = prev.findIndex(d => d.id === domainId)
      if (oldIndex === -1) return prev
      return arrayMove(prev, oldIndex, position)
    })
    await moveDomain(domainId, position)
  }

  const removeBookmark = async (bookmarkId: number, domainId: number) => {
    await deleteBookmark(bookmarkId)
    setDomains(prev =>
      prev.map(d =>
        d.id === domainId
          ? { ...d, bookmarks: d.bookmarks.filter(b => b.id !== bookmarkId) }
          : d
      )
    )
  }

  return {
    domains,
    loading,
    fetchAll,
    addDomain,
    renameDomain,
    removeDomain,
    addBookmark,
    renameBookmark,
    moveBookmark: moveBookmarkAction,
    removeBookmark,
    moveDomain: moveDomainAction,
  }
}
