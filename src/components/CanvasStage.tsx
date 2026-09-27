import { useEffect, useRef, useState } from 'react'
import { CARD_W, CARD_H } from '../types'
import type { Scene } from '../types'
import { drawScene, hitTest } from '../render'
import type { ImageMapLike } from '../imageMap'

interface Props {
  scene: Scene
  images: ImageMapLike
  imageVersion: number
  fontsReady: boolean
  selectionId: string | null
  onSelect: (id: string | null) => void
  onMoveElement: (id: string, x: number, y: number) => void
  onPanBackground: (offsetX: number, offsetY: number) => void
  onZoomBackground: (factor: number, px: number, py: number) => void
}

type Drag =
  | { mode: 'move'; id: string; start: { x: number; y: number }; orig: { x: number; y: number } }
  | { mode: 'pan'; start: { x: number; y: number }; orig: { x: number; y: number } }

export default function CanvasStage(props: Props) {
  const { scene, images, imageVersion, fontsReady, selectionId, onSelect, onMoveElement, onPanBackground, onZoomBackground } = props
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [layout, setLayout] = useState({ w: 0, h: 0, scale: 1 })
  const dragRef = useRef<Drag | null>(null)
  const [hovering, setHovering] = useState<string | null>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const update = () => {
      const cw = wrap.clientWidth
      const ch = wrap.clientHeight
      const scale = Math.max(0.05, Math.min((cw - 32) / CARD_W, (ch - 32) / CARD_H))
      setLayout({ w: CARD_W * scale, h: CARD_H * scale, scale })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || layout.w === 0) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(layout.w * dpr)
    canvas.height = Math.round(layout.h * dpr)
    canvas.style.width = `${layout.w}px`
    canvas.style.height = `${layout.h}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr * layout.scale, 0, 0, dpr * layout.scale, 0, 0)
    drawScene(ctx, scene, images, {
      selectionId,
      previewScale: layout.scale,
    })
  }, [scene, images, imageVersion, fontsReady, selectionId, layout])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const px = (e.clientX - rect.left) / layout.scale
      const py = (e.clientY - rect.top) / layout.scale
      const factor = Math.exp(-e.deltaY * 0.0015)
      onZoomBackground(factor, px, py)
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [layout.scale, onZoomBackground])

  function scenePoint(e: React.PointerEvent): { x: number; y: number } {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / layout.scale,
      y: (e.clientY - rect.top) / layout.scale,
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return
    const p = scenePoint(e)
    const hit = hitTest(scene, p)
    if (hit) {
      onSelect(hit.id)
      if (hit.type !== 'chip') {
        dragRef.current = {
          mode: 'move',
          id: hit.id,
          start: p,
          orig: { x: hit.x, y: hit.y },
        }
      }
    } else {
      onSelect(null)
      dragRef.current = {
        mode: 'pan',
        start: p,
        orig: { x: scene.background.offsetX, y: scene.background.offsetY },
      }
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current
    const p = scenePoint(e)
    if (!drag) {
      const hit = hitTest(scene, p)
      setHovering(hit ? hit.type : null)
      return
    }
    const dx = p.x - drag.start.x
    const dy = p.y - drag.start.y
    if (drag.mode === 'move') {
      onMoveElement(drag.id, drag.orig.x + dx, drag.orig.y + dy)
    } else {
      onPanBackground(drag.orig.x + dx, drag.orig.y + dy)
    }
  }

  function onPointerUp() {
    dragRef.current = null
  }

  const cursor = dragRef.current
    ? 'grabbing'
    : hovering
      ? hovering === 'chip'
        ? 'pointer'
        : 'move'
      : 'grab'

  return (
    <div className="stage" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="stage-canvas"
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="stage-caption">1536 × 969 px · drag empty space to pan · wheel to zoom background</div>
    </div>
  )
}
