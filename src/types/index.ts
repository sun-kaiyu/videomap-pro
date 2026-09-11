export interface Layer {
  id: string
  name: string
  videoPath: string | null
  thumbnail: string | null
  duration: number
  currentTime: number
  playing: boolean
  speed: number
  loop: boolean
  intensity: number
  opacity: number
  scaleX: number
  scaleY: number
  posX: number
  posY: number
  rotationZ: number
  outputIds: number[]
  inPoint: number
  outPoint: number
}

export interface Cue {
  id: string
  name: string
  layerIds: string[]
  duration: number
  transition: number
  transitionType: 'cut' | 'fade' | 'dissolve'
  action: 'play' | 'pause' | 'stop'
}

export interface Preset {
  id: string
  bankId: string
  name: string
  layerSnapshot: Partial<Layer>[]
}

export interface Bank {
  id: string
  name: string
  presets: Preset[]
}

export interface DisplayInfo {
  id: number
  index: number
  name: string
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  workArea: { x: number; y: number; width: number; height: number }
  size: { width: number; height: number }
  scaleFactor: number
  isPrimary: boolean
}

export interface MappingSurface {
  id: string
  name: string
  layerId: string
  displayId: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  perspective: boolean
  fullscreen: boolean
}

export type PanelTab = 'general' | 'parameters' | 'mapping' | 'transfer' | 'encoder' | 'remote'
