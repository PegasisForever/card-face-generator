import { useRef } from 'react'
import type { ChangeEvent } from 'react'

interface Props {
  hasBackground: boolean
  onImportBackground: (file: File) => void
  onAdd: (kind: 'text' | 'card-number' | 'name' | 'chip' | 'contactless') => void
  onOpenLogos: () => void
  onExport: () => void
  onReset: () => void
}

export default function Toolbar(props: Props) {
  const { hasBackground, onImportBackground, onAdd, onOpenLogos, onExport, onReset } = props
  const bgInputRef = useRef<HTMLInputElement>(null)

  function handleFile(cb: (f: File) => void) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) cb(file)
      e.target.value = ''
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-row">
        <span className="brand">Card Face Generator</span>
        <span className="badge">1536 × 969 PNG</span>
        <span className="spacer" />
        <button className="btn" onClick={onExport}>Export PNG</button>
        <button className="btn danger" onClick={onReset}>Reset</button>
      </div>
      <div className="topbar-row">
        <input
          ref={bgInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFile(onImportBackground)}
        />
        <button className="btn primary" onClick={() => bgInputRef.current?.click()}>
          {hasBackground ? 'Replace Background' : 'Import Background'}
        </button>
        <span className="divider" />
        <span className="group-label">Add:</span>
        <button className="btn" onClick={() => onAdd('card-number')}>Card Number</button>
        <button className="btn" onClick={() => onAdd('name')}>Name</button>
        <button className="btn" onClick={() => onAdd('text')}>Text</button>
        <button className="btn" onClick={() => onAdd('chip')}>Chip</button>
        <button className="btn" onClick={() => onAdd('contactless')}>Contactless</button>
        <button className="btn" onClick={onOpenLogos}>Logo Library…</button>
      </div>
    </header>
  )
}
