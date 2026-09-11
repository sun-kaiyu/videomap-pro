import { useAppStore } from '../store/useAppStore'
import { PlayIcon, PauseIcon, StopIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid'

export function BankGrid() {
  const banks = useAppStore(s => s.banks)
  const selectedBankId = useAppStore(s => s.selectedBankId)
  const selectBank = useAppStore(s => s.selectBank)
  const savePreset = useAppStore(s => s.savePreset)
  const loadPreset = useAppStore(s => s.loadPreset)

  const selectedBank = banks.find(b => b.id === selectedBankId) || banks[0]

  return (
    <div className="panel flex h-full overflow-hidden">
      <div className="w-20 border-r border-vm-border overflow-y-auto">
        <div className="panel-title">Bank</div>
        <div className="py-1">
          {banks.map(bank => (
            <button
              key={bank.id}
              onClick={() => selectBank(bank.id)}
              className={`w-full text-left px-3 py-1 text-xs transition-colors ${
                selectedBankId === bank.id
                  ? 'bg-vm-accent/20 text-vm-accent border-l-2 border-vm-accent'
                  : 'text-vm-muted hover:bg-vm-panelHover'
              }`}
            >
              {bank.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-vm-border text-xs text-vm-muted">
          <button className="hover:text-vm-text">Reset</button>
          <button className="hover:text-vm-text">Edit</button>
          <span>Columns</span>
          <input type="number" defaultValue={8} className="w-10" />
          <span>+</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-4 gap-2">
            {selectedBank.presets.map(preset => (
              <div
                key={preset.id}
                className="aspect-video bg-vm-bg border border-vm-border rounded flex flex-col overflow-hidden group hover:border-vm-accent transition-colors"
              >
                <div className="flex items-center justify-between px-2 py-1 border-b border-vm-border bg-vm-panelHover">
                  <span className="text-[10px] text-vm-muted truncate">{preset.name}:</span>
                </div>
                <div className="flex-1 flex items-center justify-center text-vm-muted text-xs">
                  {preset.layerSnapshot.length > 0 ? (
                    <span className="text-vm-accent">Saved</span>
                  ) : (
                    <span>EMPTY</span>
                  )}
                </div>
                <div className="flex items-center justify-between px-1 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => loadPreset(selectedBank.id, preset.id)}
                      className="p-0.5 rounded bg-vm-bg hover:bg-vm-accent hover:text-white text-vm-muted"
                    >
                      <PlayIcon className="w-3 h-3" />
                    </button>
                    <button className="p-0.5 rounded bg-vm-bg hover:bg-vm-border text-vm-muted">
                      <PauseIcon className="w-3 h-3" />
                    </button>
                    <button className="p-0.5 rounded bg-vm-bg hover:bg-vm-border text-vm-muted">
                      <StopIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => savePreset(selectedBank.id, preset.id)}
                      className="p-0.5 rounded bg-vm-bg hover:bg-vm-accent hover:text-white text-vm-muted"
                    >
                      <ArrowDownTrayIcon className="w-3 h-3" />
                    </button>
                    <button className="p-0.5 rounded bg-vm-bg hover:bg-vm-danger hover:text-white text-vm-muted">
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
