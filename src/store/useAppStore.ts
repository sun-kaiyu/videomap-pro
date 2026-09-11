import { create } from 'zustand'
import { Layer, Cue, Bank, Preset, DisplayInfo, MappingSurface, PanelTab } from '../types'

const createLayer = (index: number): Layer => ({
  id: `layer-${index}`,
  name: `Layer ${index}`,
  videoPath: null,
  thumbnail: null,
  duration: 0,
  currentTime: 0,
  playing: false,
  speed: 1,
  loop: false,
  intensity: 1,
  opacity: 1,
  scaleX: 100,
  scaleY: 100,
  posX: 0,
  posY: 0,
  rotationZ: 0,
  outputIds: [],
  inPoint: 0,
  outPoint: 0
})

const createBank = (index: number): Bank => ({
  id: `bank-${index}`,
  name: `Bank ${index}`,
  presets: Array.from({ length: 8 }, (_, i) => ({
    id: `bank-${index}-preset-${i}`,
    bankId: `bank-${index}`,
    name: `Preset ${(index - 1) * 8 + i + 1}`,
    layerSnapshot: []
  }))
})

interface AppState {
  layers: Layer[]
  selectedLayerId: string | null
  cues: Cue[]
  selectedCueId: string | null
  banks: Bank[]
  selectedBankId: string
  displays: DisplayInfo[]
  surfaces: MappingSurface[]
  panelTab: PanelTab
  encoderJobs: any[]
  syncStatus: 'idle' | 'server' | 'client'
  syncFiles: { name: string; path: string; size: number }[]
  addVideoToLayer: (layerId: string, path: string, duration: number) => void
  updateLayer: (layerId: string, updates: Partial<Layer>) => void
  setLayerPlaying: (layerId: string, playing: boolean) => void
  setLayerTime: (layerId: string, time: number) => void
  tick: (delta: number) => void
  selectLayer: (id: string | null) => void
  addCue: (cue: Cue) => void
  updateCue: (id: string, updates: Partial<Cue>) => void
  selectCue: (id: string | null) => void
  triggerCue: (id: string) => void
  selectBank: (id: string) => void
  savePreset: (bankId: string, presetId: string) => void
  loadPreset: (bankId: string, presetId: string) => void
  setDisplays: (displays: DisplayInfo[]) => void
  addSurface: (surface: MappingSurface) => void
  updateSurface: (id: string, updates: Partial<MappingSurface>) => void
  removeSurface: (id: string) => void
  setPanelTab: (tab: PanelTab) => void
  addEncoderJob: (job: any) => void
  updateEncoderJob: (id: string, updates: Partial<any>) => void
  setSyncStatus: (status: 'idle' | 'server' | 'client') => void
  addSyncFile: (file: { name: string; path: string; size: number }) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  layers: Array.from({ length: 6 }, (_, i) => createLayer(i + 1)),
  selectedLayerId: 'layer-1',
  cues: Array.from({ length: 8 }, (_, i) => ({
    id: `cue-${i + 1}`,
    name: `${i + 1}.`,
    layerIds: [],
    duration: 0,
    transition: 0,
    transitionType: 'cut',
    action: 'play'
  })),
  selectedCueId: null,
  banks: Array.from({ length: 20 }, (_, i) => createBank(i + 1)),
  selectedBankId: 'bank-1',
  displays: [],
  surfaces: [],
  panelTab: 'general',
  encoderJobs: [],
  syncStatus: 'idle',
  syncFiles: [],

  addVideoToLayer: (layerId, path, duration) => {
    set(state => ({
      layers: state.layers.map(l => l.id === layerId ? {
        ...l, videoPath: path, duration, currentTime: 0, outPoint: duration, playing: false
      } : l)
    }))
  },

  updateLayer: (layerId, updates) => {
    set(state => ({
      layers: state.layers.map(l => l.id === layerId ? { ...l, ...updates } : l)
    }))
  },

  setLayerPlaying: (layerId, playing) => {
    set(state => ({
      layers: state.layers.map(l => l.id === layerId ? { ...l, playing } : l)
    }))
  },

  setLayerTime: (layerId, time) => {
    set(state => ({
      layers: state.layers.map(l => l.id === layerId ? { ...l, currentTime: time } : l)
    }))
  },

  tick: (delta) => {
    set(state => ({
      layers: state.layers.map(l => {
        if (!l.playing || !l.duration) return l
        const next = l.currentTime + delta * l.speed
        if (next >= (l.outPoint || l.duration)) {
          if (l.loop) return { ...l, currentTime: l.inPoint || 0 }
          return { ...l, currentTime: l.outPoint || l.duration, playing: false }
        }
        return { ...l, currentTime: next }
      })
    }))
  },

  selectLayer: (id) => set({ selectedLayerId: id }),

  addCue: (cue) => set(state => ({ cues: [...state.cues, cue] })),

  updateCue: (id, updates) => {
    set(state => ({
      cues: state.cues.map(c => c.id === id ? { ...c, ...updates } : c)
    }))
  },

  selectCue: (id) => set({ selectedCueId: id }),

  triggerCue: (id) => {
    const cue = get().cues.find(c => c.id === id)
    if (!cue) return
    cue.layerIds.forEach(lid => {
      get().setLayerPlaying(lid, cue.action === 'play')
      if (cue.action === 'stop') get().setLayerTime(lid, 0)
    })
  },

  selectBank: (id) => set({ selectedBankId: id }),

  savePreset: (bankId, presetId) => {
    const snapshot = get().layers.map(l => ({ id: l.id, videoPath: l.videoPath, opacity: l.opacity }))
    set(state => ({
      banks: state.banks.map(b => b.id === bankId ? {
        ...b,
        presets: b.presets.map(p => p.id === presetId ? { ...p, layerSnapshot: snapshot } : p)
      } : b)
    }))
  },

  loadPreset: (bankId, presetId) => {
    const preset = get().banks.find(b => b.id === bankId)?.presets.find(p => p.id === presetId)
    if (!preset) return
    preset.layerSnapshot.forEach(snap => {
      if (snap.id) get().updateLayer(snap.id, snap)
    })
  },

  setDisplays: (displays) => set({ displays }),

  addSurface: (surface) => set(state => ({ surfaces: [...state.surfaces, surface] })),

  updateSurface: (id, updates) => {
    set(state => ({
      surfaces: state.surfaces.map(s => s.id === id ? { ...s, ...updates } : s)
    }))
  },

  removeSurface: (id) => {
    set(state => ({
      surfaces: state.surfaces.filter(s => s.id !== id)
    }))
  },

  setPanelTab: (tab) => set({ panelTab: tab }),

  addEncoderJob: (job) => set(state => ({ encoderJobs: [...state.encoderJobs, job] })),

  updateEncoderJob: (id, updates) => {
    set(state => ({
      encoderJobs: state.encoderJobs.map(j => j.id === id ? { ...j, ...updates } : j)
    }))
  },

  setSyncStatus: (status) => set({ syncStatus: status }),

  addSyncFile: (file) => set(state => ({ syncFiles: [...state.syncFiles, file] }))
}))
