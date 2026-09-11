import { useEffect, useRef } from 'react'
import { useAppStore } from './store/useAppStore'
import { TopBar } from './components/TopBar'
import { LeftPanel } from './components/LeftPanel'
import { LayerMonitor } from './components/LayerMonitor'
import { BankGrid } from './components/BankGrid'
import { MappingPanel } from './components/MappingPanel'
import { TranscoderPanel } from './components/TranscoderPanel'
import { SyncPanel } from './components/SyncPanel'
import { OutputView } from './components/OutputView'
import { CueList } from './components/CueList'

function App() {
  const panelTab = useAppStore(s => s.panelTab)
  const tick = useAppStore(s => s.tick)
  const setDisplays = useAppStore(s => s.setDisplays)

  const lastTick = useRef(0)

  // Output window mode: #/output/layer-id
  const hash = window.location.hash
  const outputMatch = hash.match(/#\/output\/([^/]+)/)
  const outputLayerId = outputMatch ? outputMatch[1] : null

  useEffect(() => {
    let frame: number
    const loop = (t: number) => {
      const delta = lastTick.current ? (t - lastTick.current) / 1000 : 0
      lastTick.current = t
      tick(delta)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [tick])

  useEffect(() => {
    const loadDisplays = async () => {
      if (window.electronAPI) {
        const displays = await window.electronAPI.getDisplays()
        setDisplays(displays)
      }
    }
    loadDisplays()
    window.addEventListener('resize', loadDisplays)
    return () => window.removeEventListener('resize', loadDisplays)
  }, [setDisplays])

  if (outputLayerId) {
    return <OutputView layerId={outputLayerId} />
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-vm-bg text-vm-text overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <div className="flex flex-col flex-1 min-w-0">
          {panelTab === 'mapping' ? (
            <MappingPanel />
          ) : panelTab === 'encoder' ? (
            <TranscoderPanel />
          ) : panelTab === 'transfer' ? (
            <SyncPanel />
          ) : panelTab === 'cue' ? (
            <CueList />
          ) : (
            <>
              <div className="flex-1 min-h-0 p-2 overflow-hidden">
                <LayerMonitor />
              </div>
              <div className="h-80 min-h-[320px] p-2 pt-0">
                <BankGrid />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
