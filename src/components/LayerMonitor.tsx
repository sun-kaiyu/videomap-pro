import React from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatDuration } from '../lib/utils'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  WindowIcon
} from '@heroicons/react/24/solid'

export function LayerMonitor() {
  const layers = useAppStore(s => s.layers)
  const selectedLayerId = useAppStore(s => s.selectedLayerId)
  const selectLayer = useAppStore(s => s.selectLayer)
  const setLayerPlaying = useAppStore(s => s.setLayerPlaying)
  const setLayerTime = useAppStore(s => s.setLayerTime)
  const updateLayer = useAppStore(s => s.updateLayer)

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden">
      <div className="flex items-center gap-2 text-xs text-vm-muted shrink-0">
        <span>Reset Columns</span>
        <input type="number" defaultValue={8} className="w-10" />
        <span>+</span>
        <span>Layers</span>
        <input type="number" defaultValue={6} className="w-10" />
        <span>+</span>
        <span>Surfaces</span>
        <input type="number" defaultValue={1} className="w-10" />
        <label className="flex items-center gap-1 ml-2">
          <input type="checkbox" className="accent-vm-accent" /> Led
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" className="accent-vm-accent" /> KlingNet
        </label>
        <span>Outputs</span>
        <input type="number" defaultValue={1} className="w-10" />
        <span>+</span>
        <span>Floating</span>
        <span className="ml-auto">Previews</span>
      </div>

      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-2 min-h-0">
        {layers.map(layer => (
          <div
            key={layer.id}
            onClick={() => selectLayer(layer.id)}
            className={`panel flex flex-col overflow-hidden cursor-pointer transition-all ${
              selectedLayerId === layer.id ? 'ring-2 ring-vm-accent' : ''
            }`}
          >
            <div className="flex items-center justify-between px-2 py-1 border-b border-vm-border bg-vm-panelHover">
              <span className="text-xs font-medium">{layer.name}:</span>
              <div className="flex gap-0.5">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setLayerPlaying(layer.id, !layer.playing)
                  }}
                  className="p-0.5 rounded hover:bg-vm-border text-vm-muted hover:text-vm-text"
                >
                  {layer.playing ? <PauseIcon className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setLayerPlaying(layer.id, false)
                    setLayerTime(layer.id, 0)
                  }}
                  className="p-0.5 rounded hover:bg-vm-border text-vm-muted hover:text-vm-text"
                >
                  <StopIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    updateLayer(layer.id, { loop: !layer.loop })
                  }}
                  className={`p-0.5 rounded ${layer.loop ? 'text-vm-accent bg-vm-accent/10' : 'text-vm-muted hover:text-vm-text'}`}
                >
                  <ArrowPathIcon className="w-3 h-3" />
                </button>
                <button className="p-0.5 rounded text-vm-muted hover:text-vm-text">
                  <EyeIcon className="w-3 h-3" />
                </button>
                <span className="text-[10px] px-1 rounded bg-vm-bg text-vm-muted">FX</span>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleOpenOutput(layer.id)
                  }}
                  className="p-0.5 rounded hover:bg-vm-border text-vm-muted hover:text-vm-text"
                >
                  <WindowIcon className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black relative min-h-0 flex items-center justify-center">
              {layer.videoPath ? (
                <PreviewVideo layer={layer} />
              ) : (
                <div className="flex flex-col items-center gap-1 text-vm-muted">
                  <ArrowsPointingOutIcon className="w-8 h-8 opacity-30" />
                  <span className="text-xs">Empty</span>
                </div>
              )}
            </div>

            <div className="px-2 py-1 border-t border-vm-border flex items-center justify-between text-[10px] text-vm-muted bg-vm-panelHover">
              <span>{formatDuration(layer.currentTime)}</span>
              <span>/{formatDuration(layer.duration)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewVideo({ layer }: { layer: ReturnType<typeof useAppStore.getState>['layers'][0] }) {
  const videoRef = React.useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
    if (!videoRef.current || !layer.videoPath) return
    const v = videoRef.current
    if (v.src !== `file://${layer.videoPath}`) {
      v.src = `file://${layer.videoPath}`
      v.currentTime = layer.currentTime
    }
    if (layer.playing) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [layer.videoPath, layer.playing])

  React.useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - layer.currentTime) > 0.2) {
      videoRef.current.currentTime = layer.currentTime
    }
  }, [layer.currentTime])

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-contain"
      muted
      playsInline
      loop={layer.loop}
      onTimeUpdate={e => {
        const t = (e.target as HTMLVideoElement).currentTime
        useAppStore.getState().setLayerTime(layer.id, t)
      }}
    />
  )
}

async function handleOpenOutput(layerId: string) {
  if (!window.electronAPI) return
  await window.electronAPI.openOutputWindow({ layerId, fullscreen: true })
}

