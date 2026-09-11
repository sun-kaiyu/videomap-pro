import { useAppStore } from '../store/useAppStore'
import { formatDuration } from '../lib/utils'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  BackwardIcon,
  ForwardIcon,
  ArrowPathIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/solid'

export function LeftPanel() {
  const layers = useAppStore(s => s.layers)
  const selectedLayerId = useAppStore(s => s.selectedLayerId)
  const updateLayer = useAppStore(s => s.updateLayer)
  const setLayerPlaying = useAppStore(s => s.setLayerPlaying)
  const setLayerTime = useAppStore(s => s.setLayerTime)
  const selectLayer = useAppStore(s => s.selectLayer)

  const layer = layers.find(l => l.id === selectedLayerId) || layers[0]

  const handleVideoSelect = async () => {
    if (!window.electronAPI) return
    const paths = await window.electronAPI.selectVideo()
    if (paths.length) {
      const info = await window.electronAPI.getVideoInfo(paths[0])
      selectLayer(layer.id)
      updateLayer(layer.id, {
        videoPath: paths[0],
        duration: info.duration || 0,
        outPoint: info.duration || 0,
        currentTime: 0
      })
    }
  }

  const togglePlay = () => {
    if (!layer.videoPath) return
    setLayerPlaying(layer.id, !layer.playing)
  }

  const stop = () => {
    setLayerPlaying(layer.id, false)
    setLayerTime(layer.id, 0)
  }

  const skip = (amount: number) => {
    setLayerTime(layer.id, Math.max(0, Math.min(layer.duration, layer.currentTime + amount)))
  }

  return (
    <div className="w-72 shrink-0 bg-vm-panel border-r border-vm-border flex flex-col overflow-hidden">
      <div className="panel-title">Visual</div>
      <div className="p-3 border-b border-vm-border">
        <button
          onClick={handleVideoSelect}
          className="w-full h-20 bg-vm-bg border border-dashed border-vm-border rounded flex items-center justify-center text-vm-muted text-xs hover:border-vm-accent hover:text-vm-accent transition-colors"
        >
          {layer.videoPath ? layer.videoPath.split(/[\\/]/).pop() : 'Click here'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title="Visual">
          <ParamRow label="Intensity">
            <RangeSlider
              value={layer.intensity}
              min={0}
              max={1}
              step={0.01}
              onChange={v => updateLayer(layer.id, { intensity: v })}
            />
          </ParamRow>
          <ParamRow label="Intensity 0 Behavi...">
            <div className="flex gap-1">
              <MiniBtn><PlayIcon className="w-3 h-3" /></MiniBtn>
              <MiniBtn><PauseIcon className="w-3 h-3" /></MiniBtn>
            </div>
          </ParamRow>
          <ParamRow label="Folder"><span className="param-value">0</span></ParamRow>
          <ParamRow label="File"><span className="param-value">0</span></ParamRow>
          <ParamRow label="Ignore Alpha">
            <input
              type="checkbox"
              checked={false}
              onChange={() => {}}
              className="accent-vm-accent"
            />
          </ParamRow>
          <ParamRow label="Aspect Ratio">
            <div className="flex gap-1">
              <MiniBtn active>Fit</MiniBtn>
              <MiniBtn>Fill</MiniBtn>
              <MiniBtn>Stretch</MiniBtn>
            </div>
          </ParamRow>
          <ParamRow label="Output"><span className="param-value">0 - All outputs</span></ParamRow>
        </Section>

        <Section title="Text & Controls">
          <ParamRow label="Folder"><span className="param-value">0</span></ParamRow>
          <ParamRow label="File"><span className="param-value">0</span></ParamRow>
          {['Parameter 1', 'Parameter 2', 'Parameter 3', 'Parameter 4'].map((label, i) => (
            <ParamRow key={label} label={label}>
              <RangeSlider
                value={0}
                min={0}
                max={1}
                step={0.01}
                onChange={() => {}}
              />
            </ParamRow>
          ))}
        </Section>

        <Section title="Playback">
          <div className="param-row">
            <span className="param-label">Mode</span>
            <div className="flex gap-0.5">
              <MiniBtn><PlayIcon className="w-3 h-3" /></MiniBtn>
              <MiniBtn><BackwardIcon className="w-3 h-3" /></MiniBtn>
              <MiniBtn><ForwardIcon className="w-3 h-3" /></MiniBtn>
              <MiniBtn><PauseIcon className="w-3 h-3" /></MiniBtn>
              <MiniBtn><StopIcon className="w-3 h-3" /></MiniBtn>
              <MiniBtn>TC</MiniBtn>
              <MiniBtn><ArrowPathIcon className="w-3 h-3" /></MiniBtn>
              <MiniBtn><ArrowsRightLeftIcon className="w-3 h-3" /></MiniBtn>
            </div>
          </div>
          <ParamRow label="Speed">
            <RangeSlider
              value={layer.speed}
              min={-4}
              max={4}
              step={0.25}
              onChange={v => updateLayer(layer.id, { speed: v })}
            />
          </ParamRow>
          <div className="px-3 py-1 flex justify-between text-[10px] text-vm-muted">
            {['-4x', '-3x', '-2x', '-1x', '0x', '1x', '2x', '3x', '4x'].map(s => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <ParamRow label="Segment">
            <div className="w-full h-1.5 bg-vm-bg rounded overflow-hidden">
              <div
                className="h-full bg-vm-accent"
                style={{ width: `${layer.duration ? (layer.currentTime / layer.duration) * 100 : 0}%` }}
              />
            </div>
          </ParamRow>
          <ParamRow label="Start Point"><span className="param-value">0 frames</span></ParamRow>
          <ParamRow label="In Point"><span className="param-value">{formatDuration(layer.inPoint)}</span></ParamRow>
          <ParamRow label="Out Point" highlight>
            <span className="param-value text-vm-accent">{formatDuration(layer.outPoint)}</span>
          </ParamRow>
        </Section>

        <Section title="Pre Fx Pose">
          <ParamRow label="Scale X">
            <RangeSlider value={layer.scaleX} min={0} max={200} step={1} onChange={v => updateLayer(layer.id, { scaleX: v })} />
          </ParamRow>
          <ParamRow label="Scale Y">
            <RangeSlider value={layer.scaleY} min={0} max={200} step={1} onChange={v => updateLayer(layer.id, { scaleY: v })} />
          </ParamRow>
          <ParamRow label="Position X Pixels">
            <input
              type="number"
              value={layer.posX}
              onChange={e => updateLayer(layer.id, { posX: parseFloat(e.target.value) || 0 })}
              className="w-16 text-right"
            />
          </ParamRow>
          <ParamRow label="Position Y Pixels">
            <input
              type="number"
              value={layer.posY}
              onChange={e => updateLayer(layer.id, { posY: parseFloat(e.target.value) || 0 })}
              className="w-16 text-right"
            />
          </ParamRow>
          <ParamRow label="Rotation Z">
            <input
              type="number"
              value={layer.rotationZ}
              onChange={e => updateLayer(layer.id, { rotationZ: parseFloat(e.target.value) || 0 })}
              className="w-16 text-right"
            />
          </ParamRow>
        </Section>
      </div>

      <div className="border-t border-vm-border p-2 flex gap-1">
        <button onClick={togglePlay} className="btn btn-primary flex-1 flex items-center justify-center gap-1">
          {layer.playing ? <PauseIcon className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
          {layer.playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={stop} className="btn btn-secondary"><StopIcon className="w-3 h-3" /></button>
        <button onClick={() => skip(-5)} className="btn btn-secondary"><BackwardIcon className="w-3 h-3" /></button>
        <button onClick={() => skip(5)} className="btn btn-secondary"><ForwardIcon className="w-3 h-3" /></button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-vm-border last:border-b-0">
      <div className="text-xs font-semibold text-vm-text px-3 py-2 flex items-center gap-2">
        {title}
        <ArrowPathIcon className="w-3 h-3 text-vm-muted ml-auto" />
      </div>
      <div className="pb-2">{children}</div>
    </div>
  )
}

function ParamRow({ label, children, highlight }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`param-row ${highlight ? 'bg-vm-accent/10' : ''}`}>
      <span className="param-label">{label}</span>
      <div className="flex-1 flex justify-end items-center gap-2 min-w-0">{children}</div>
    </div>
  )
}

function RangeSlider({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 flex-1 justify-end">
      <span className="text-[10px] text-vm-muted w-12 text-right tabular-nums">{value.toFixed(2)}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-24"
      />
    </div>
  )
}

function MiniBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button className={`p-1 rounded ${active ? 'bg-vm-accent text-white' : 'bg-vm-bg text-vm-muted hover:text-vm-text'}`}>
      {children}
    </button>
  )
}
