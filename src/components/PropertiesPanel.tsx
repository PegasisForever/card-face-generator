import type { Scene, SceneElement, TextElement, ContactlessElement, ImageElement, FontFamily } from '../types'
import type { ReactNode } from 'react'
import { elementLabel } from '../defaults'
import type { ImageMapLike } from '../imageMap'

interface Props {
  scene: Scene
  images: ImageMapLike
  selectionId: string | null
  onSelect: (id: string | null) => void
  updateElement: (id: string, patch: Partial<SceneElement>) => void
  deleteElement: (id: string) => void
  duplicateElement: (id: string) => void
  moveLayer: (id: string, to: 'front' | 'back') => void
  setBackgroundScale: (scale: number) => void
  fitBackground: () => void
  removeBackground: () => void
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="prop-row">
      <label>{label}</label>
      <div className="prop-control">{children}</div>
    </div>
  )
}

function Num({ value, onChange, min, max, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = parseFloat(e.target.value)
        if (Number.isFinite(v)) onChange(v)
      }}
    />
  )
}

function Slide({ value, onChange, min, max, step = 1 }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  return (
    <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value))} />
  )
}

function Color({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
}

function TextElementProps({ el, update }: { el: TextElement; update: (patch: Partial<TextElement>) => void }) {
  return (
    <>
      <Row label="Content">
        <textarea value={el.content} rows={2} onChange={(e) => update({ content: e.target.value })} />
      </Row>
      <Row label="Font">
        <select value={el.fontFamily} onChange={(e) => update({ fontFamily: e.target.value as FontFamily })}>
          <option value="mono">Monospace</option>
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="visa-light">Visa Dialect Light</option>
          <option value="visa-regular">Visa Dialect Regular</option>
        </select>
      </Row>
      <Row label="Size">
        <Slide value={el.fontSize} min={10} max={240} onChange={(v) => update({ fontSize: v })} />
        <Num value={el.fontSize} onChange={(v) => update({ fontSize: v })} />
      </Row>
      <Row label="Bold">
        <input type="checkbox" checked={el.bold} onChange={(e) => update({ bold: e.target.checked })} />
      </Row>
      <Row label="Spacing">
        <Num value={el.letterSpacing} onChange={(v) => update({ letterSpacing: v })} min={-10} max={60} />
      </Row>
      <Row label="Color">
        <Color value={el.color} onChange={(v) => update({ color: v })} />
      </Row>
      <Row label="Shadow">
        <input type="checkbox" checked={el.shadow} onChange={(e) => update({ shadow: e.target.checked })} />
      </Row>
    </>
  )
}

function ContactlessProps({ el, update }: { el: ContactlessElement; update: (patch: Partial<ContactlessElement>) => void }) {
  return (
    <>
      <Row label="Size">
        <Slide value={el.size} min={24} max={220} onChange={(v) => update({ size: v })} />
        <Num value={el.size} onChange={(v) => update({ size: v })} />
      </Row>
      <Row label="Color">
        <Color value={el.color} onChange={(v) => update({ color: v })} />
      </Row>
    </>
  )
}

function ImageProps({ el, update }: { el: ImageElement; update: (patch: Partial<ImageElement>) => void }) {
  return (
    <Row label="Width">
      <Slide value={el.width} min={40} max={900} onChange={(v) => update({ width: v })} />
      <Num value={el.width} onChange={(v) => update({ width: v })} />
    </Row>
  )
}

export default function PropertiesPanel(props: Props) {
  const {
    scene, selectionId, onSelect, updateElement, deleteElement, duplicateElement, moveLayer,
    setBackgroundScale, fitBackground, removeBackground,
  } = props
  const selected = scene.elements.find((e) => e.id === selectionId) ?? null

  function update(patch: Record<string, unknown>) {
    if (selected) updateElement(selected.id, patch as Partial<SceneElement>)
  }

  return (
    <aside className="panel">
      <section className="panel-section">
        <h3>Layers</h3>
        {scene.elements.length === 0 && <p className="muted">No elements yet.</p>}
        <ul className="layers">
          {[...scene.elements].reverse().map((el) => (
            <li
              key={el.id}
              className={el.id === selectionId ? 'active' : ''}
              onClick={() => onSelect(el.id)}
            >
              <span className="layer-type">{el.type}</span>
              <span className="layer-label">{elementLabel(el)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-section">
        {selected ? (
          <>
            <h3>Properties · {selected.type}</h3>
            {selected.type !== 'chip' && (
              <>
                <Row label="X">
                  <Num value={selected.x} onChange={(v) => update({ x: v })} />
                </Row>
                <Row label="Y">
                  <Num value={selected.y} onChange={(v) => update({ y: v })} />
                </Row>
              </>
            )}
            <Row label="Opacity">
              <Slide value={selected.opacity} min={0.05} max={1} step={0.05} onChange={(v) => update({ opacity: v })} />
            </Row>
            {selected.type === 'chip' && (
              <p className="muted">
                Chip is fixed to the card standard: 13 × 10 mm, 10.2 mm from the left edge,
                centred 25 mm from the top. Same slot on every real payment card.
              </p>
            )}
            {selected.type === 'text' && <TextElementProps el={selected} update={update} />}
            {selected.type === 'contactless' && <ContactlessProps el={selected} update={update} />}
            {selected.type === 'image' && <ImageProps el={selected} update={update} />}
            <div className="btn-row">
              {selected.type !== 'chip' && (
                <button className="btn small" onClick={() => duplicateElement(selected.id)}>Duplicate</button>
              )}
              <button className="btn small" onClick={() => moveLayer(selected.id, 'front')}>To Front</button>
              <button className="btn small" onClick={() => moveLayer(selected.id, 'back')}>To Back</button>
              <button className="btn small danger" onClick={() => deleteElement(selected.id)}>Delete</button>
            </div>
          </>
        ) : (
          <>
            <h3>Background</h3>
            {scene.background.src ? (
              <>
                <Row label="Scale">
                  <Slide value={scene.background.scale} min={0.05} max={8} step={0.01} onChange={setBackgroundScale} />
                  <Num value={scene.background.scale} onChange={setBackgroundScale} step={0.05} />
                </Row>
                <div className="btn-row">
                  <button className="btn small" onClick={fitBackground}>Fit to Card</button>
                  <button className="btn small danger" onClick={removeBackground}>Remove</button>
                </div>
                <p className="muted">Drag empty canvas space to move the background. Use the mouse wheel to zoom.</p>
              </>
            ) : (
              <p className="muted">No background. Use "Import Background" in the top bar.</p>
            )}
          </>
        )}
      </section>
    </aside>
  )
}
