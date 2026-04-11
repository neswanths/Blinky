import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { Domain } from '../api/bookmarks'
import Section from './Section'
import Modal from './Modal'

interface Props {
  domains: Domain[]
  onAddDomain: (name: string) => Promise<any>
  onRenameDomain: (id: number, name: string) => Promise<void>
  onDeleteDomain: (id: number) => Promise<void>
  onAddBookmark: (url: string, title: string, domainId: number) => Promise<any>
  onRenameBookmark: (bookmarkId: number, domainId: number, title: string) => Promise<void>
  onMoveBookmark: (bookmarkId: number, fromDomainId: number, toDomainId: number, position?: number) => Promise<void>
  onDeleteBookmark: (bookmarkId: number, domainId: number) => Promise<void>
  onMoveDomain: (domainId: number, position: number) => Promise<void>
}

export default function SectionGrid({
  domains,
  onAddDomain,
  onRenameDomain,
  onDeleteDomain,
  onAddBookmark,
  onRenameBookmark,
  onMoveBookmark,
  onDeleteBookmark,
  onMoveDomain,
}: Props) {
  const [showNewSection, setShowNewSection] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Track which domain the dragged bookmark is currently over
  const [overDomainId, setOverDomainId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function findDomainOfBookmark(bookmarkDndId: string): number | undefined {
    const bookmarkId = parseInt(bookmarkDndId.replace('bookmark-', ''))
    return domains.find(d => d.bookmarks.some(b => b.id === bookmarkId))?.id
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) { setOverDomainId(null); return }
    if ((active.id as string).startsWith('domain-')) return

    // Check if hovering over a domain drop zone
    if ((over.id as string).startsWith('domain-')) {
      const domainId = parseInt((over.id as string).replace('domain-', ''))
      setOverDomainId(domainId)
    } else if ((over.id as string).startsWith('bookmark-')) {
      // Hovering over another bookmark — find its domain
      const domainId = findDomainOfBookmark(over.id as string)
      setOverDomainId(domainId ?? null)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverDomainId(null)

    if (!over || !active.id) return
    const activeDndId = active.id as string
    
    if (activeDndId.startsWith('domain-')) {
      if (active.id !== over.id) {
        const domainId = parseInt(activeDndId.replace('domain-', ''))
        const overIndex = domains.findIndex(d => `domain-${d.id}` === over.id)
        if (overIndex !== -1) {
          onMoveDomain(domainId, overIndex)
        }
      }
      return
    }

    if (!activeDndId.startsWith('bookmark-')) return

    const bookmarkId = parseInt(activeDndId.replace('bookmark-', ''))
    const fromDomainId = findDomainOfBookmark(activeDndId)
    if (!fromDomainId) return

    // Determine target domain
    let toDomainId: number | undefined
    let insertIndex: number | undefined
    const overId = over.id as string
    
    if (overId.startsWith('domain-')) {
      toDomainId = parseInt(overId.replace('domain-', ''))
      insertIndex = undefined
    } else if (overId.startsWith('bookmark-')) {
      toDomainId = findDomainOfBookmark(overId)
      const targetDomain = domains.find(d => d.id === toDomainId)
      if (targetDomain) {
        insertIndex = over.data.current?.sortable?.index
        if (insertIndex === undefined) {
          const overBookmarkId = parseInt(overId.replace('bookmark-', ''))
          insertIndex = targetDomain.bookmarks.findIndex(b => b.id === overBookmarkId)
        }
      }
    }

    if (!toDomainId) return
    if (toDomainId === fromDomainId && insertIndex === undefined) return // dropping on same section generally

    onMoveBookmark(bookmarkId, fromDomainId, toDomainId, insertIndex)
  }

  // Find active bookmark data for DragOverlay
  const activeDomain = activeId
    ? domains.find(d => d.bookmarks.some(b => `bookmark-${b.id}` === activeId))
    : null
  const activeBookmark = activeDomain?.bookmarks.find(b => `bookmark-${b.id}` === activeId)
  
  const activeDomainObject = activeId?.startsWith('domain-')
    ? domains.find(d => `domain-${d.id}` === activeId)
    : null

  const domainSortableIds = domains.map(d => `domain-${d.id}`)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="section-grid">
        <SortableContext items={domainSortableIds} strategy={rectSortingStrategy}>
          {domains.map(domain => (
            <Section
              key={domain.id}
              domain={domain}
              isOver={overDomainId === domain.id}
              onRename={name => onRenameDomain(domain.id, name)}
              onDelete={() => onDeleteDomain(domain.id)}
              onAddBookmark={(url, title) => onAddBookmark(url, title, domain.id)}
              onRenameBookmark={(bookmarkId, title) => onRenameBookmark(bookmarkId, domain.id, title)}
              onDeleteBookmark={bookmarkId => onDeleteBookmark(bookmarkId, domain.id)}
            />
          ))}
        </SortableContext>

        {/* Add section button */}
        <button className="add-section-btn" onClick={() => setShowNewSection(true)}>
          <span className="add-section-plus">+</span>
          <span>New section</span>
        </button>
      </div>

      {/* DragOverlay — ghost element while dragging */}
      <DragOverlay>
      <DragOverlay>
        {activeBookmark ? (
          <div className="drag-ghost">
            {activeBookmark.title}
          </div>
        ) : activeDomainObject ? (
          <div className="drag-ghost section-card" style={{ height: 320, width: 280, opacity: 0.9, transform: 'rotate(2deg)' }}>
            <div className="section-header">
               <h3 className="section-title">{activeDomainObject.name}</h3>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <Modal
        isOpen={showNewSection}
        title="New Section"
        desc="Create a new category for your bookmarks."
        inputs={[{ type: 'text', placeholder: 'e.g., AI Tools, Research, Projects', id: 'name' }]}
        confirmText="Create"
        onConfirm={async (vals) => {
          const name = vals['name'].trim()
          if (!name) return false
          await onAddDomain(name)
        }}
        onClose={() => setShowNewSection(false)}
      />
    </DndContext>
  )
}
