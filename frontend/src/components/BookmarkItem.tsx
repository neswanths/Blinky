import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bookmark } from '../api/bookmarks'

interface Props {
  bookmark: Bookmark
  domainId: number
  onRename: (id: number, title: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

function getFavicon(url: string) {
  try {
    const { hostname } = new URL(url.startsWith('http') ? url : `https://${url}`)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch {
    return ''
  }
}

export default function BookmarkItem({ bookmark, onRename, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(bookmark.title)
  const [imgError, setImgError] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `bookmark-${bookmark.id}`, data: { bookmarkId: bookmark.id } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        className={`bookmark-item ${isDragging ? 'dragging' : ''}`}
      >
        {/* Drag handle */}
        <span className="drag-handle" {...attributes} {...listeners} title="Drag to move">
          ⠿
        </span>

        <div className="bookmark-content">
          {!imgError ? (
            <img
              src={getFavicon(bookmark.url)}
              alt=""
              className="bookmark-favicon"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="bookmark-favicon fallback-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
          )}
          {isEditing ? (
            <input
              autoFocus
              className="inplace-input"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => {
                if (editTitle.trim() && editTitle !== bookmark.title) {
                  onRename(bookmark.id, editTitle.trim())
                } else {
                  setEditTitle(bookmark.title) // reset
                }
                setIsEditing(false)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') {
                  setEditTitle(bookmark.title) // cancel
                  setIsEditing(false)
                }
              }}
            />
          ) : (
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="bookmark-link">
              {bookmark.title}
            </a>
          )}
        </div>

        <div className="bookmark-actions">
          <button
            className="icon-btn edit-btn"
            title="Rename"
            onClick={() => setIsEditing(true)}
          >
            ✎
          </button>
          <button
            className="icon-btn delete-btn"
            title="Delete"
            onClick={() => onDelete(bookmark.id)}
          >
            ×
          </button>
        </div>
      </li>
    </>
  )
}
