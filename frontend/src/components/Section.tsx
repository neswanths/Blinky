import { useState } from 'react'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Domain } from '../api/bookmarks'
import BookmarkItem from './BookmarkItem'
import Modal from './Modal'

interface Props {
  domain: Domain
  onRename: (name: string) => Promise<void>
  onDelete: () => Promise<void>
  onAddBookmark: (url: string, title: string) => Promise<void>
  onRenameBookmark: (id: number, title: string) => Promise<void>
  onDeleteBookmark: (id: number) => Promise<void>
  isOver?: boolean
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  return trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`
}

function titleFromUrl(url: string): string {
  try {
    const { hostname } = new URL(url)
    return hostname.replace('www.', '').split('.')[0]
  } catch {
    return url
  }
}

export default function Section({
  domain,
  onRename,
  onDelete,
  onAddBookmark,
  onRenameBookmark,
  onDeleteBookmark,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(domain.name)

  // Make this section a drop zone
  const { setNodeRef, isOver } = useDroppable({
    id: `domain-${domain.id}`,
    data: { domainId: domain.id },
  })

  const sortableIds = domain.bookmarks.map(b => `bookmark-${b.id}`)

  return (
    <>
      <div
        ref={setNodeRef}
        className={`section-card ${isOver ? 'drop-target' : ''}`}
        id={`domain-${domain.id}`}
      >
        {/* Header */}
        <div className="section-header">
          {isEditingTitle ? (
            <input
              autoFocus
              className="inplace-input section-title-input"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => {
                if (editTitle.trim() && editTitle !== domain.name) {
                  onRename(editTitle.trim())
                } else {
                  setEditTitle(domain.name)
                }
                setIsEditingTitle(false)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') {
                  setEditTitle(domain.name)
                  setIsEditingTitle(false)
                }
              }}
            />
          ) : (
            <h3 className="section-title">{domain.name}</h3>
          )}
          <div className="section-controls">
            <button
              className="icon-btn edit-btn"
              title="Rename section"
              onClick={() => setIsEditingTitle(true)}
            >
              ✎
            </button>
            <button
              className="icon-btn delete-btn"
              title="Delete section"
              onClick={() => setShowDeleteModal(true)}
            >
              ×
            </button>
          </div>
        </div>

        {/* Bookmark list */}
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <ul className="bookmark-list">
            {domain.bookmarks
              .map(b => (
                <BookmarkItem
                  key={b.id}
                  bookmark={b}
                  domainId={domain.id}
                  onRename={onRenameBookmark}
                  onDelete={onDeleteBookmark}
                />
              ))}
          </ul>
        </SortableContext>

        {/* Add button */}
        <button className="add-url-btn" onClick={() => setShowAddModal(true)}>
          + add url
        </button>
      </div>

      {/* Add bookmark modal */}
      <Modal
        isOpen={showAddModal}
        title="Add Bookmark"
        desc={`Add a link to <b>${domain.name}</b>`}
        inputs={[{ type: 'text', placeholder: 'google.com or https://...', id: 'url' }]}
        confirmText="Add"
        onConfirm={async (vals) => {
          const raw = vals['url']
          if (!raw) return false
          const url = normalizeUrl(raw)
          await onAddBookmark(url, titleFromUrl(url))
        }}
        onClose={() => setShowAddModal(false)}
      />

      {/* Delete section modal */}
      <Modal
        isOpen={showDeleteModal}
        title="Delete Section?"
        desc={`Delete <b>${domain.name}</b> and all its bookmarks? This cannot be undone.`}
        confirmText="Delete"
        danger
        onConfirm={async () => { await onDelete() }}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  )
}
