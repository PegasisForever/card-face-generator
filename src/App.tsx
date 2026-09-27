import { useEffect, useMemo, useRef, useState } from 'react'
import type { Scene, SceneElement } from './types'
import { CARD_W, CARD_H } from './types'
import { exportScenePNG } from './render'
import { fileToDataURL, loadImage } from './imageUtils'
import { createElement, clamp, initialScene, loadScene, saveScene, STORAGE_KEY } from './defaults'
import type { AddKind } from './defaults'
import type { ImageMapLike } from './imageMap'
import LogoPicker from './components/LogoPicker'
import { logoUrl } from './logoLibrary'
import type { LogoEntry } from './logoLibrary'
import Toolbar from './components/Toolbar'
import CanvasStage from './components/CanvasStage'
import PropertiesPanel from './components/PropertiesPanel'

function useImages(scene: Scene): { images: ImageMapLike; version: number } {
  const imagesRef = useRef<ImageMapLike>(new Map())
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const needed = new Set<string>()
    if (scene.background.src) needed.add(scene.background.src)
    for (const el of scene.elements) {
      if (el.type === 'image') needed.add(el.src)
    }
    let changed = false
    for (const src of needed) {
      if (!imagesRef.current.has(src)) {
        changed = true
        const img = new Image()
        img.onload = () => setVersion((v) => v + 1)
        img.src = src
        imagesRef.current.set(src, img)
      }
    }
    for (const key of Array.from(imagesRef.current.keys())) {
      if (!needed.has(key)) imagesRef.current.delete(key)
    }
    if (changed) setVersion((v) => v + 1)
  }, [scene])

  return { images: imagesRef.current, version }
}

export default function App() {
  const [scene, setScene] = useState<Scene>(() => loadScene() ?? initialScene())
  const [selectionId, setSelectionId] = useState<string | null>(null)
  const [showLogos, setShowLogos] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const { images, version } = useImages(scene)
  const sceneRef = useRef(scene)
  sceneRef.current = scene

  useEffect(() => {
    saveScene(scene)
  }, [scene])

  useEffect(() => {
    Promise.all([
      document.fonts.load('20px "Visa Dialect Light"'),
      document.fonts.load('20px "Visa Dialect Regular"'),
    ])
      .catch(() => undefined)
      .finally(() => setFontsReady(true))
  }, [])

  function patchElement(id: string, patch: Partial<SceneElement>) {
    setScene((s) => ({
      ...s,
      elements: s.elements.map((el) => (el.id === id ? ({ ...el, ...patch } as SceneElement) : el)),
    }))
  }

  function deleteElement(id: string) {
    setScene((s) => ({ ...s, elements: s.elements.filter((e) => e.id !== id) }))
    setSelectionId((cur) => (cur === id ? null : cur))
  }

  function duplicateElement(id: string) {
    const src = sceneRef.current.elements.find((e) => e.id === id)
    if (!src) return
    const copy = { ...src, id: crypto.randomUUID(), x: src.x + 24, y: src.y + 24 } as SceneElement
    setScene((s) => ({ ...s, elements: [...s.elements, copy] }))
    setSelectionId(copy.id)
  }

  function moveLayer(id: string, to: 'front' | 'back') {
    setScene((s) => {
      const el = s.elements.find((e) => e.id === id)
      if (!el) return s
      const rest = s.elements.filter((e) => e.id !== id)
      return { ...s, elements: to === 'front' ? [...rest, el] : [el, ...rest] }
    })
  }

  function addElement(kind: Exclude<AddKind, 'logo'>) {
    const el = createElement(kind)
    setScene((s) => ({ ...s, elements: [...s.elements, el] }))
    setSelectionId(el.id)
  }

  async function addLogo(file: File) {
    const src = await fileToDataURL(file)
    const img = await loadImage(src)
    const aspect = img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1
    const el = createElement('logo', { src, aspect })
    setScene((s) => ({ ...s, elements: [...s.elements, el] }))
    setSelectionId(el.id)
    setShowLogos(false)
  }

  async function addLibraryLogo(entry: LogoEntry) {
    const src = logoUrl(entry.file)
    const img = await loadImage(src)
    const aspect = img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1
    const el = createElement('logo', { src, aspect })
    setScene((s) => ({ ...s, elements: [...s.elements, el] }))
    setSelectionId(el.id)
    setShowLogos(false)
  }

  async function importBackground(file: File) {
    const src = await fileToDataURL(file)
    const img = await loadImage(src)
    const scale = Math.max(CARD_W / img.naturalWidth, CARD_H / img.naturalHeight)
    setScene((s) => ({
      ...s,
      background: {
        src,
        scale,
        offsetX: (CARD_W - img.naturalWidth * scale) / 2,
        offsetY: (CARD_H - img.naturalHeight * scale) / 2,
      },
    }))
  }

  function fitBackground() {
    const src = sceneRef.current.background.src
    if (!src) return
    const img = images.get(src)
    if (!img || !img.naturalWidth) return
    const scale = Math.max(CARD_W / img.naturalWidth, CARD_H / img.naturalHeight)
    setScene((s) => ({
      ...s,
      background: {
        ...s.background,
        scale,
        offsetX: (CARD_W - img.naturalWidth * scale) / 2,
        offsetY: (CARD_H - img.naturalHeight * scale) / 2,
      },
    }))
  }

  function panBackground(offsetX: number, offsetY: number) {
    setScene((s) => ({ ...s, background: { ...s.background, offsetX, offsetY } }))
  }

  function zoomBackground(factor: number, px: number, py: number) {
    setScene((s) => {
      const bg = s.background
      const next = clamp(bg.scale * factor, 0.05, 12)
      const k = next / bg.scale
      return {
        ...s,
        background: {
          ...bg,
          scale: next,
          offsetX: px - (px - bg.offsetX) * k,
          offsetY: py - (py - bg.offsetY) * k,
        },
      }
    })
  }

  function removeBackground() {
    setScene((s) => ({ ...s, background: { src: null, offsetX: 0, offsetY: 0, scale: 1 } }))
  }

  async function exportPNG() {
    const blob = await exportScenePNG(sceneRef.current, images)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'card-face-1536x969.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  function resetAll() {
    if (!window.confirm('Remove the background and all elements?')) return
    localStorage.removeItem(STORAGE_KEY)
    setScene(initialScene())
    setSelectionId(null)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      if (!selectionId) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteElement(selectionId)
        e.preventDefault()
        return
      }
      const step = e.shiftKey ? 10 : 1
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      const m = moves[e.key]
      if (m) {
        const el = sceneRef.current.elements.find((x) => x.id === selectionId)
        if (el && el.type !== 'chip') patchElement(selectionId, { x: el.x + m[0], y: el.y + m[1] })
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionId])

  const hasBackground = useMemo(() => !!scene.background.src, [scene.background.src])

  return (
    <div className="app">
      <Toolbar
        hasBackground={hasBackground}
        onImportBackground={importBackground}
        onAdd={addElement}
        onOpenLogos={() => setShowLogos(true)}
        onExport={exportPNG}
        onReset={resetAll}
      />
      <div className="main">
        <CanvasStage
          scene={scene}
          images={images}
          imageVersion={version}
          fontsReady={fontsReady}
          selectionId={selectionId}
          onSelect={setSelectionId}
          onMoveElement={(id, x, y) => patchElement(id, { x, y })}
          onPanBackground={panBackground}
          onZoomBackground={zoomBackground}
        />
        <PropertiesPanel
          scene={scene}
          images={images}
          selectionId={selectionId}
          onSelect={setSelectionId}
          updateElement={patchElement}
          deleteElement={deleteElement}
          duplicateElement={duplicateElement}
          moveLayer={moveLayer}
          setBackgroundScale={(scale) => setScene((s) => ({ ...s, background: { ...s.background, scale } }))}
          fitBackground={fitBackground}
          removeBackground={removeBackground}
        />
      </div>
      <LogoPicker
        open={showLogos}
        onPick={addLibraryLogo}
        onCustomFile={addLogo}
        onClose={() => setShowLogos(false)}
      />
    </div>
  )
}
