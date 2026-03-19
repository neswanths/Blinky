import { useEffect, useRef, useState } from 'react'

interface ModalInput {
  type: string
  placeholder: string
  id: string
}

interface ModalProps {
  isOpen: boolean
  title: string
  desc?: string
  inputs?: ModalInput[]
  confirmText?: string
  onConfirm: (values: Record<string, string>) => Promise<boolean | void> | boolean | void
  onClose: () => void
  danger?: boolean
  children?: React.ReactNode
}

export default function Modal({
  isOpen,
  title,
  desc,
  inputs = [],
  confirmText = 'Confirm',
  onConfirm,
  onClose,
  danger = false,
  children,
}: ModalProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      const init: Record<string, string> = {}
      inputs.forEach(i => { init[i.id] = '' })
      setValues(init)
      setError('')
      setTimeout(() => firstInputRef.current?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await onConfirm(values)
      if (result !== false) onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <h3 className="modal-title">{title}</h3>
        {desc && <p className="modal-desc" dangerouslySetInnerHTML={{ __html: desc }} />}

        <div className="modal-body">
          {inputs.map((inp, i) => (
            <input
              key={inp.id}
              ref={i === 0 ? firstInputRef : undefined}
              type={inp.type}
              placeholder={inp.placeholder}
              value={values[inp.id] || ''}
              onChange={e => setValues(v => ({ ...v, [inp.id]: e.target.value }))}
              className="modal-input"
            />
          ))}
          {error && <p className="modal-error">{error}</p>}
          {children}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
