import type { Scene, SceneElement } from './types'

export type AddKind = 'text' | 'card-number' | 'name' | 'chip' | 'contactless' | 'logo'

export const STORAGE_KEY = 'card-face-generator-v1'

/**
 * Chip placement follows the payment-card standard.
 * Card is 85.6 × 53.98 mm mapped to 1536 × 969 px, so 1 mm = 17.95 px.
 * Visible contact plate is about 13 × 10 mm, its left edge 10.2 mm from
 * the card edge, vertical centre 25 mm from the top.
 */
export const CHIP_STANDARD = {
  x: Math.round(10.2 * 17.95), // 183 px
  y: Math.round((25 - 10 / 2) * 17.95), // 360 px
  width: Math.round(13 * 17.95), // 233 px
}

export function initialScene(): Scene {
  return {
    background: { src: null, offsetX: 0, offsetY: 0, scale: 1 },
    elements: [],
  }
}

export function createElement(kind: AddKind, extra?: { src: string; aspect: number }): SceneElement {
  const id = crypto.randomUUID()
  switch (kind) {
    case 'card-number':
      return { id, type: 'text', x: 96, y: 600, opacity: 1, content: '1234 5678 9012 3456', fontSize: 58, fontFamily: 'mono', color: '#ffffff', bold: false, letterSpacing: 3, shadow: true }
    case 'name':
      return { id, type: 'text', x: 96, y: 720, opacity: 1, content: 'CARDHOLDER NAME', fontSize: 34, fontFamily: 'sans', color: '#e8e8ea', bold: false, letterSpacing: 4, shadow: true }
    case 'text':
      return { id, type: 'text', x: 96, y: 830, opacity: 1, content: 'Your text', fontSize: 36, fontFamily: 'sans', color: '#ffffff', bold: false, letterSpacing: 0, shadow: true }
    case 'chip':
      return { id, type: 'chip', x: CHIP_STANDARD.x, y: CHIP_STANDARD.y, opacity: 1, width: CHIP_STANDARD.width }
    case 'contactless':
      return { id, type: 'contactless', x: 1300, y: 280, opacity: 1, size: 64, color: '#f5f5f7' }
    case 'logo':
      return { id, type: 'image', x: 1160, y: 700, opacity: 1, src: extra?.src ?? '', width: 240, aspect: extra?.aspect ?? 1 }
  }
}

export function elementLabel(el: SceneElement): string {
  switch (el.type) {
    case 'text':
      return el.content.split('\n')[0] || 'Text'
    case 'chip':
      return 'Chip'
    case 'contactless':
      return 'Contactless'
    case 'image':
      return 'Logo'
  }
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

export function loadScene(): Scene | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    const d = data as {
      background?: { src?: unknown; offsetX?: unknown; offsetY?: unknown; scale?: unknown }
      elements?: unknown
    }
    const bg = d.background ?? {}
    const valid = new Set(['text', 'chip', 'contactless', 'image'])
    const elements = Array.isArray(d.elements)
      ? (d.elements as unknown[]).filter(
          (e): e is SceneElement =>
            !!e && typeof e === 'object' && valid.has((e as { type?: string }).type ?? ''),
        )
      : []
    return {
      background: {
        src: typeof bg.src === 'string' ? bg.src : null,
        offsetX: num(bg.offsetX),
        offsetY: num(bg.offsetY),
        scale: num(bg.scale, 1),
      },
      elements,
    }
  } catch {
    return null
  }
}

export function saveScene(scene: Scene) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scene))
  } catch {
    // Storage full or unavailable; keep working without persistence.
  }
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
