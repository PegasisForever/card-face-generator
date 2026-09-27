import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { logoGroups, logoUrl } from '../logoLibrary'
import type { LogoEntry } from '../logoLibrary'

interface Props {
  open: boolean
  onPick: (entry: LogoEntry) => void
  onCustomFile: (file: File) => void
  onClose: () => void
}

export default function LogoPicker({ open, onPick, onCustomFile, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  if (!open) return null

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onCustomFile(file)
    e.target.value = ''
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Pick a logo</h2>
          <button className="btn small" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          {logoGroups().map(({ group, entries }) => (
            <div key={group} className="logo-group">
              <h3>{group}</h3>
              <div className="logo-grid">
                {entries.map((entry) => (
                  <button key={entry.file} className="logo-tile" onClick={() => onPick(entry)} title={entry.label}>
                    <img src={logoUrl(entry.file)} alt={entry.label} loading="lazy" />
                    <span>{entry.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
          <button className="btn" onClick={() => fileRef.current?.click()}>Upload custom logo…</button>
          <span className="muted">Logos belong to their owners. Personal use only.</span>
        </div>
      </div>
    </div>
  )
}
