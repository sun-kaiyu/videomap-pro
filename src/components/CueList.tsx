import { useAppStore } from '../store/useAppStore'
import { formatDuration } from '../lib/utils'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ForwardIcon,
  BackwardIcon,
  TrashIcon,
  FilmIcon,
  PencilIcon
} from '@heroicons/react/24/solid'

export function CueList() {
  const cues = useAppStore(s => s.cues)
  const selectedCueId = useAppStore(s => s.selectedCueId)
  const layers = useAppStore(s => s.layers)
  const updateCue = useAppStore(s => s.updateCue)
  const selectCue = useAppStore(s => s.selectCue)
  const triggerCue = useAppStore(s => s.triggerCue)
  const setLayerPlaying = useAppStore(s => s.setLayerPlaying)

  const setCueAction = (id: string, action: 'play' | 'pause' | 'stop') => {
    updateCue(id, { action })
  }

  const setTransitionType = (id: string, type: 'cut' | 'fade' | 'dissolve') => {
    updateCue(id, { transitionType: type })
  }

  const updateDuration = (id: string, value: string) => {
    const seconds = parseDuration(value)
    updateCue(id, { duration: seconds })
  }

  const updateTransition = (id: string, value: string) => {
    const seconds = parseDuration(value)
    updateCue(id, { transition: seconds })
  }

  const allStop = () => {
    layers.forEach(l => setLayerPlaying(l.id, false))
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-vm-text">Remote Player / Cue List</h2>
        <div className="flex gap-2">
          <button onClick={allStop} className="btn btn-secondary">Stop All</button>
          <button onClick={() => selectCue(null)} className="btn btn-secondary">Clear</button>
        </div>
      </div>

      <div className="panel flex-1 overflow-hidden flex flex-col">
        <div className="panel-title">Cue</div>
        <div className="flex-1 overflow-y-auto p-2">
          {cues.map((cue, index) => (
            <div
              key={cue.id}
              onClick={() => selectCue(cue.id)}
              className={`flex items-center gap-3 p-2 mb-2 rounded border transition-colors ${
                selectedCueId === cue.id
                  ? 'bg-vm-accent/10 border-vm-accent'
                  : 'bg-vm-bg border-vm-border hover:border-vm-muted'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center rounded bg-vm-panelHover text-xs font-medium text-vm-muted">
                {index + 1}
              </div>

              <input
                type="text"
                value={cue.name}
                onChange={e => updateCue(cue.id, { name: e.target.value })}
                onClick={e => e.stopPropagation()}
                className="w-24 bg-transparent border-b border-vm-border focus:border-vm-accent text-xs text-vm-text outline-none"
              />

              <div className="flex items-center gap-2 text-xs">
                <FilmIcon className="w-3 h-3 text-vm-muted" />
                <span className="text-vm-muted">Duration</span>
                <input
                  type="text"
                  value={formatDuration(cue.duration)}
                  onChange={e => updateDuration(cue.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="w-20 bg-vm-bg border border-vm-border rounded px-1 text-vm-text tabular-nums"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <PencilIcon className="w-3 h-3 text-vm-muted" />
                <span className="text-vm-muted">Transition</span>
                <input
                  type="text"
                  value={formatDuration(cue.transition)}
                  onChange={e => updateTransition(cue.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="w-20 bg-vm-bg border border-vm-border rounded px-1 text-vm-text tabular-nums"
                />
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-vm-muted">Action</span>
                <ActionBtn active={cue.action === 'play'} onClick={() => setCueAction(cue.id, 'play')}><PlayIcon className="w-3 h-3" /></ActionBtn>
                <ActionBtn active={cue.action === 'pause'} onClick={() => setCueAction(cue.id, 'pause')}><PauseIcon className="w-3 h-3" /></ActionBtn>
                <ActionBtn active={cue.action === 'stop'} onClick={() => setCueAction(cue.id, 'stop')}><StopIcon className="w-3 h-3" /></ActionBtn>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-vm-muted">Type</span>
                <TypeBtn active={cue.transitionType === 'cut'} onClick={() => setTransitionType(cue.id, 'cut')}>Cut</TypeBtn>
                <TypeBtn active={cue.transitionType === 'fade'} onClick={() => setTransitionType(cue.id, 'fade')}>Fade</TypeBtn>
                <TypeBtn active={cue.transitionType === 'dissolve'} onClick={() => setTransitionType(cue.id, 'dissolve')}>Dissolve</TypeBtn>
              </div>

              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => triggerCue(cue.id)} className="btn btn-primary py-1 px-2">
                  <ForwardIcon className="w-3 h-3" />
                </button>
                <button className="btn btn-secondary py-1 px-2">
                  <BackwardIcon className="w-3 h-3" />
                </button>
                <button className="btn btn-secondary py-1 px-2 text-vm-danger hover:bg-vm-danger hover:text-white">
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-1 rounded ${active ? 'bg-vm-accent text-white' : 'bg-vm-bg text-vm-muted hover:text-vm-text'}`}
    >
      {children}
    </button>
  )
}

function TypeBtn({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-1.5 py-0.5 rounded text-[10px] ${active ? 'bg-vm-accent text-white' : 'bg-vm-bg text-vm-muted hover:text-vm-text'}`}
    >
      {children}
    </button>
  )
}

function parseDuration(value: string): number {
  const parts = value.split(':')
  if (parts.length === 4) {
    const h = parseInt(parts[0]) || 0
    const m = parseInt(parts[1]) || 0
    const s = parseInt(parts[2]) || 0
    const ms = parseInt(parts[3]) || 0
    return h * 3600 + m * 60 + s + ms / 1000
  }
  const num = parseFloat(value)
  return isNaN(num) ? 0 : num
}
