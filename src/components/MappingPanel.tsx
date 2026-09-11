import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { DisplayInfo } from '../types'
import { WindowIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid'

export function MappingPanel() {
  const displays = useAppStore(s => s.displays)
  const layers = useAppStore(s => s.layers)
  const surfaces = useAppStore(s => s.surfaces)
  const addSurface = useAppStore(s => s.addSurface)
  const updateSurface = useAppStore(s => s.updateSurface)
  const removeSurface = useAppStore(s => s.removeSurface)
  const [selectedSurfaceId, setSelectedSurfaceId] = useState<string | null>(null)

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getDisplays().then((d: DisplayInfo[]) => {
        useAppStore.getState().setDisplays(d)
      })
    }
  }, [])

  const selectedSurface = surfaces.find(s => s.id === selectedSurfaceId)

  const createSurface = () => {
    const primary = displays.find(d => d.isPrimary) || displays[0]
    const layer = layers[0]
    if (!primary || !layer) return
    const surface = {
      id: `surface-${Date.now()}`,
      name: `Surface ${surfaces.length + 1}`,
      layerId: layer.id,
      displayId: primary.id,
      x: 0,
      y: 0,
      width: 400,
      height: 300,
      rotation: 0,
      perspective: false,
      fullscreen: false
    }
    addSurface(surface)
    setSelectedSurfaceId(surface.id)
  }

  const openSurfaceOutput = async (surface: any) => {
    if (!window.electronAPI) return
    const display = displays.find(d => d.id === surface.displayId)
    if (!display) return
    await window.electronAPI.openOutputWindow({
      layerId: surface.layerId,
      displayId: display.id,
      width: surface.fullscreen ? display.bounds.width : surface.width,
      height: surface.fullscreen ? display.bounds.height : surface.height,
      fullscreen: surface.fullscreen
    })
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-64 border-r border-vm-border bg-vm-panel flex flex-col">
        <div className="panel-title flex items-center justify-between">
          Mapping Setup
          <button onClick={createSurface} className="p-1 rounded hover:bg-vm-border text-vm-muted hover:text-vm-text">
            <PlusIcon className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {displays.length === 0 && (
            <div className="text-xs text-vm-muted p-2">No extended displays detected. Connect a monitor and click refresh.</div>
          )}
          {displays.map(d => (
            <div key={d.id} className="bg-vm-bg border border-vm-border rounded p-2">
              <div className="flex items-center gap-2 text-xs font-medium text-vm-text">
                <WindowIcon className="w-3 h-3 text-vm-accent" />
                {d.name} {d.isPrimary && <span className="text-vm-accent">(Primary)</span>}
              </div>
              <div className="text-[10px] text-vm-muted mt-1">
                {d.bounds.width}x{d.bounds.height} @ ({d.bounds.x}, {d.bounds.y})
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="panel-title">Surfaces</div>
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 gap-2">
            {surfaces.map(surface => {
              const layer = layers.find(l => l.id === surface.layerId)
              const display = displays.find(d => d.id === surface.displayId)
              return (
                <div
                  key={surface.id}
                  onClick={() => setSelectedSurfaceId(surface.id)}
                  className={`bg-vm-bg border rounded p-3 cursor-pointer transition-colors ${
                    selectedSurfaceId === surface.id ? 'border-vm-accent' : 'border-vm-border hover:border-vm-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-vm-text">{surface.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); openSurfaceOutput(surface) }}
                        className="px-2 py-0.5 text-[10px] rounded bg-vm-panelHover hover:bg-vm-accent hover:text-white text-vm-muted"
                      >
                        Open Output
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); removeSurface(surface.id) }}
                        className="p-0.5 rounded hover:bg-vm-danger hover:text-white text-vm-muted"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-vm-muted mt-1">
                    Layer: {layer?.name || '-'} | Display: {display?.name || '-'} | {surface.width}x{surface.height} @ ({surface.x}, {surface.y})
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {selectedSurface && (
          <div className="h-64 border-t border-vm-border bg-vm-panel p-3 overflow-y-auto">
            <div className="text-xs font-semibold text-vm-text mb-2">Coordinates</div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <CoordinateField label="X" value={selectedSurface.x} onChange={v => updateSurface(selectedSurface.id, { x: v })} />
              <CoordinateField label="Y" value={selectedSurface.y} onChange={v => updateSurface(selectedSurface.id, { y: v })} />
              <CoordinateField label="W" value={selectedSurface.width} onChange={v => updateSurface(selectedSurface.id, { width: v })} />
              <CoordinateField label="H" value={selectedSurface.height} onChange={v => updateSurface(selectedSurface.id, { height: v })} />
              <CoordinateField label="R" value={selectedSurface.rotation} onChange={v => updateSurface(selectedSurface.id, { rotation: v })} />
            </div>
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedSurface.fullscreen}
                  onChange={e => updateSurface(selectedSurface.id, { fullscreen: e.target.checked })}
                  className="accent-vm-accent"
                />
                Fullscreen on display
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedSurface.perspective}
                  onChange={e => updateSurface(selectedSurface.id, { perspective: e.target.checked })}
                  className="accent-vm-accent"
                />
                Perspective correction
              </label>
            </div>
            <div className="mt-3">
              <label className="text-xs text-vm-muted">Mapped Layer</label>
              <select
                value={selectedSurface.layerId}
                onChange={e => updateSurface(selectedSurface.id, { layerId: e.target.value })}
                className="w-full mt-1"
              >
                {layers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CoordinateField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-vm-muted w-4">{label}</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full text-xs"
      />
    </div>
  )
}
