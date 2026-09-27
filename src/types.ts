export const CARD_W = 1536
export const CARD_H = 969

export interface SceneBackground {
  src: string | null
  offsetX: number
  offsetY: number
  scale: number
}

export interface ElementBase {
  id: string
  x: number
  y: number
  opacity: number
}

export type FontFamily = 'mono' | 'sans' | 'serif' | 'visa-light' | 'visa-regular'

export interface TextElement extends ElementBase {
  type: 'text'
  content: string
  fontSize: number
  fontFamily: FontFamily
  color: string
  bold: boolean
  letterSpacing: number
  shadow: boolean
}

export interface ChipElement extends ElementBase {
  type: 'chip'
  width: number
}

export interface ContactlessElement extends ElementBase {
  type: 'contactless'
  size: number
  color: string
}

export interface ImageElement extends ElementBase {
  type: 'image'
  src: string
  width: number
  aspect: number
}

export type SceneElement = TextElement | ChipElement | ContactlessElement | ImageElement

export interface Scene {
  background: SceneBackground
  elements: SceneElement[]
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}
