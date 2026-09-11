import { useAppStore } from '../store/useAppStore'

export function TopBar() {
  const panelTab = useAppStore(s => s.panelTab)
  const setPanelTab = useAppStore(s => s.setPanelTab)

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'parameters', label: 'Parameters' },
    { id: 'cue', label: 'Remote Player' },
    { id: 'mapping', label: 'Mapping' },
    { id: 'transfer', label: 'Transfer' },
    { id: 'encoder', label: 'Saga Encoder' }
  ]

  return (
    <div className="h-12 bg-vm-panel border-b border-vm-border flex items-center px-4 shrink-0">
      <div className="flex items-center gap-2 mr-6">
        <div className="w-7 h-7 rounded bg-gradient-to-br from-vm-accent to-vm-purple flex items-center justify-center font-bold text-white text-sm">
          VM
        </div>
        <span className="font-semibold text-sm">VideoMap Pro</span>
      </div>

      <div className="flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setPanelTab(tab.id as any)}
            className={`px-4 py-1.5 text-xs rounded transition-colors ${
              panelTab === tab.id
                ? 'bg-vm-accent text-white'
                : 'text-vm-muted hover:text-vm-text hover:bg-vm-panelHover'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3 text-xs text-vm-muted">
        <span className="px-2 py-0.5 bg-vm-panelHover rounded">Live</span>
        <span>v1.0.0</span>
      </div>
    </div>
  )
}
