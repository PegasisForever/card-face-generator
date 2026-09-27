import { CARD_W, CARD_H } from './types'
import type {
  Box,
  ChipElement,
  ContactlessElement,
  ImageElement,
  Scene,
  SceneElement,
  TextElement,
} from './types'
import type { ImageMapLike } from './imageMap'

const FONTS: Record<TextElement['fontFamily'], string> = {
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, "Courier New", monospace',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  'visa-light': '"Visa Dialect Light", sans-serif',
  'visa-regular': '"Visa Dialect Regular", sans-serif',
}

export interface DrawOptions {
  forExport?: boolean
  selectionId?: string | null
  previewScale?: number
}

let measureCtx: CanvasRenderingContext2D | null = null
function getMeasureCtx(): CanvasRenderingContext2D {
  if (!measureCtx) {
    const c = document.createElement('canvas')
    measureCtx = c.getContext('2d') as CanvasRenderingContext2D
  }
  return measureCtx
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
  if ('letterSpacing' in c) c.letterSpacing = `${px}px`
}

function fontString(el: TextElement): string {
  return `${el.bold ? '700 ' : '400 '}${el.fontSize}px ${FONTS[el.fontFamily]}`
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export function textSize(el: TextElement): { w: number; h: number } {
  const ctx = getMeasureCtx()
  ctx.font = fontString(el)
  setLetterSpacing(ctx, el.letterSpacing)
  const lines = el.content.split('\n')
  let w = 0
  for (const line of lines) w = Math.max(w, ctx.measureText(line).width)
  const h = lines.length * el.fontSize * 1.25
  return { w, h }
}

export function chipGeom(el: ChipElement): { w: number; h: number; r: number } {
  return { w: el.width, h: el.width * 0.76, r: el.width * 0.09 }
}

export function contactlessGeom(el: ContactlessElement): { lw: number; cx: number; cy: number; radii: number[]; box: Box } {
  const size = el.size
  const lw = size * 0.085
  const cx = el.x + size * 0.34
  const cy = el.y + size / 2
  const radii = [0.14, 0.24, 0.34, 0.44].map((f) => f * size)
  return { lw, cx, cy, radii, box: { x: el.x, y: el.y, w: size * 0.9, h: size } }
}

export function imageHeight(el: ImageElement): number {
  return el.aspect > 0 ? el.width / el.aspect : el.width
}

export function elementBBox(el: SceneElement): Box {
  switch (el.type) {
    case 'text': {
      const s = textSize(el)
      return { x: el.x, y: el.y, w: s.w, h: s.h }
    }
    case 'chip': {
      const g = chipGeom(el)
      return { x: el.x, y: el.y, w: g.w, h: g.h }
    }
    case 'contactless':
      return contactlessGeom(el).box
    case 'image':
      return { x: el.x, y: el.y, w: el.width, h: imageHeight(el) }
  }
}

export function hitTest(scene: Scene, p: { x: number; y: number }, pad = 6): SceneElement | null {
  for (let i = scene.elements.length - 1; i >= 0; i--) {
    const el = scene.elements[i]
    const b = elementBBox(el)
    if (p.x >= b.x - pad && p.x <= b.x + b.w + pad && p.y >= b.y - pad && p.y <= b.y + b.h + pad) {
      return el
    }
  }
  return null
}

function drawChecker(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#1b1e22'
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.fillStyle = '#23262c'
  const tile = 32
  for (let row = 0; row * tile < CARD_H; row++) {
    for (let col = 0; col * tile < CARD_W; col++) {
      if ((row + col) % 2 === 0) {
        ctx.fillRect(col * tile, row * tile, tile, tile)
      }
    }
  }
}

function drawText(ctx: CanvasRenderingContext2D, el: TextElement) {
  ctx.font = fontString(el)
  setLetterSpacing(ctx, el.letterSpacing)
  ctx.textBaseline = 'top'
  ctx.fillStyle = el.color
  if (el.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = el.fontSize * 0.12
    ctx.shadowOffsetY = el.fontSize * 0.05
  }
  const lines = el.content.split('\n')
  const lh = el.fontSize * 1.25
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], el.x, el.y + i * lh)
  }
}

function drawChip(ctx: CanvasRenderingContext2D, el: ChipElement) {
  const { w, h, r } = chipGeom(el)
  const x = el.x
  const y = el.y
  const grad = ctx.createLinearGradient(x, y, x + w, y + h)
  grad.addColorStop(0, '#f2d489')
  grad.addColorStop(0.35, '#caa04a')
  grad.addColorStop(0.6, '#a87e2e')
  grad.addColorStop(1, '#dcb964')
  roundedRectPath(ctx, x, y, w, h, r)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.lineWidth = Math.max(1, w * 0.016)
  ctx.strokeStyle = 'rgba(70, 50, 8, 0.45)'
  ctx.stroke()

  ctx.strokeStyle = 'rgba(78, 56, 12, 0.55)'
  ctx.lineWidth = Math.max(1, w * 0.022)
  ctx.lineCap = 'round'
  ctx.beginPath()
  const iy = y + h * 0.16
  const ih = h * 0.68
  ctx.moveTo(x + w * 0.5, iy)
  ctx.lineTo(x + w * 0.5, iy + ih)
  ctx.moveTo(x + w * 0.12, iy + ih * 0.33)
  ctx.lineTo(x + w * 0.88, iy + ih * 0.33)
  ctx.moveTo(x + w * 0.12, iy + ih * 0.67)
  ctx.lineTo(x + w * 0.88, iy + ih * 0.67)
  for (const fx of [0.28, 0.72]) {
    ctx.moveTo(x + w * fx, iy)
    ctx.lineTo(x + w * fx, iy + ih * 0.33)
    ctx.moveTo(x + w * fx, iy + ih * 0.67)
    ctx.lineTo(x + w * fx, iy + ih)
  }
  ctx.stroke()
}

function drawContactless(ctx: CanvasRenderingContext2D, el: ContactlessElement) {
  const g = contactlessGeom(el)
  ctx.strokeStyle = el.color
  ctx.lineWidth = g.lw
  ctx.lineCap = 'round'
  const a0 = (-55 * Math.PI) / 180
  const a1 = (55 * Math.PI) / 180
  for (const r of g.radii) {
    ctx.beginPath()
    ctx.arc(g.cx, g.cy, r, a0, a1)
    ctx.stroke()
  }
}

function drawImageElement(ctx: CanvasRenderingContext2D, el: ImageElement, images: ImageMapLike, opts: DrawOptions) {
  const img = images.get(el.src)
  const h = imageHeight(el)
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, el.x, el.y, el.width, h)
  } else if (!opts.forExport) {
    ctx.save()
    ctx.strokeStyle = 'rgba(120, 200, 255, 0.6)'
    ctx.setLineDash([8, 6])
    ctx.strokeRect(el.x, el.y, el.width, h)
    ctx.restore()
  }
}

function drawSelection(ctx: CanvasRenderingContext2D, el: SceneElement, previewScale: number) {
  const b = elementBBox(el)
  const lw = 2 / previewScale
  const pad = 4 / previewScale
  ctx.save()
  ctx.strokeStyle = '#4cc2ff'
  ctx.lineWidth = lw
  ctx.setLineDash([6 / previewScale, 4 / previewScale])
  ctx.strokeRect(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2)
  ctx.setLineDash([])
  ctx.fillStyle = '#4cc2ff'
  const s = 8 / previewScale
  for (const [hx, hy] of [
    [b.x - pad, b.y - pad],
    [b.x + b.w + pad, b.y - pad],
    [b.x - pad, b.y + b.h + pad],
    [b.x + b.w + pad, b.y + b.h + pad],
  ]) {
    ctx.fillRect(hx - s / 2, hy - s / 2, s, s)
  }
  ctx.restore()
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  images: ImageMapLike,
  opts: DrawOptions = {},
) {
  const { forExport = false, selectionId = null, previewScale = 1 } = opts
  ctx.clearRect(0, 0, CARD_W, CARD_H)
  if (!forExport) drawChecker(ctx)

  if (scene.background.src) {
    const img = images.get(scene.background.src)
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(
        img,
        scene.background.offsetX,
        scene.background.offsetY,
        img.naturalWidth * scene.background.scale,
        img.naturalHeight * scene.background.scale,
      )
    }
  } else if (!forExport && scene.elements.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '30px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Import a background image to start', CARD_W / 2, CARD_H / 2)
    ctx.textAlign = 'start'
    ctx.textBaseline = 'alphabetic'
  }

  for (const el of scene.elements) {
    ctx.save()
    ctx.globalAlpha = el.opacity
    switch (el.type) {
      case 'text':
        drawText(ctx, el)
        break
      case 'chip':
        drawChip(ctx, el)
        break
      case 'contactless':
        drawContactless(ctx, el)
        break
      case 'image':
        drawImageElement(ctx, el, images, opts)
        break
    }
    ctx.restore()
  }

  if (!forExport && selectionId) {
    const el = scene.elements.find((e) => e.id === selectionId)
    if (el) drawSelection(ctx, el, previewScale)
  }
}

export async function exportScenePNG(scene: Scene, images: ImageMapLike): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  drawScene(ctx, scene, images, { forExport: true })
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
}
