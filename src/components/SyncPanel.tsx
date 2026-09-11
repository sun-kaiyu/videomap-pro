import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { ArrowRightIcon, ArrowLeftIcon, ServerIcon, TrashIcon, RefreshCwIcon } from '@heroicons/react/24/solid'

export function SyncPanel() {
  const syncFiles = useAppStore(s => s.syncFiles)
  const syncStatus = useAppStore(s => s.syncStatus)
  const setSyncStatus = useAppStore(s => s.setSyncStatus)
  const addSyncFile = useAppStore(s => s.addSyncFile)
  const [localIps, setLocalIps] = useState<string[]>([])
  const [remoteHost, setRemoteHost] = useState('')
  const [status, setStatus] = useState('Disconnected')
  const [localFiles, setLocalFiles] = useState<{ path: string; name: string }[]>([])
  const [receivedFiles, setReceivedFiles] = useState<{ name: string; path: string }[]>([])

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.getLocalIPs().then(setLocalIps)

    const unsubReceived = window.electronAPI.onSyncFileReceived((data: any) => {
      setReceivedFiles(prev => [...prev, data])
      addSyncFile({ name: data.name, path: data.path, size: 0 })
    })

    const unsubReady = window.electronAPI.onSyncServerReady((data: any) => {
      setStatus(`Server listening on port ${data.port}`)
      setSyncStatus('server')
    })

    return () => {
      unsubReceived()
      unsubReady()
    }
  }, [addSyncFile, setSyncStatus])

  const startServer = async () => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.syncStartServer()
    setLocalIps(result.ips)
    setSyncStatus('server')
  }

  const addLocalFiles = async () => {
    if (!window.electronAPI) return
    const paths = await window.electronAPI.selectVideo()
    setLocalFiles(prev => [...prev, ...paths.map(p => ({ path: p, name: p.split(/[\\/]/).pop() || p }))])
  }

  const sendFile = async (file: { path: string; name: string }) => {
    if (!window.electronAPI || !remoteHost) return
    try {
      setStatus(`Sending ${file.name}...`)
      await window.electronAPI.syncSendFile({ host: remoteHost, filePath: file.path })
      setStatus(`Sent ${file.name}`)
    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-vm-text">TRANSFER / REMOTE PLAYER</h2>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={startServer} className="btn btn-secondary flex items-center gap-1">
            <ServerIcon className="w-3 h-3" /> Start Server
          </button>
          <button onClick={addLocalFiles} className="btn btn-primary">Add Files</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="panel flex flex-col">
          <div className="panel-title">Local Library</div>
          <div className="p-2 border-b border-vm-border">
            <div className="text-[10px] text-vm-muted mb-1">This machine IPs</div>
            <div className="text-xs text-vm-text">{localIps.join(', ') || 'Unknown'}</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {localFiles.map(file => (
              <div key={file.path} className="flex items-center justify-between p-2 bg-vm-bg border border-vm-border rounded mb-2">
                <div className="text-xs text-vm-text truncate mr-2">{file.name}</div>
                <button onClick={() => sendFile(file)} className="p-1 rounded bg-vm-accent text-white hover:bg-vm-accentHover">
                  <ArrowRightIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-vm-border flex items-center gap-2 text-xs">
            <span className="text-vm-muted">Remote host:</span>
            <input
              type="text"
              value={remoteHost}
              onChange={e => setRemoteHost(e.target.value)}
              placeholder="192.168.1.100"
              className="flex-1"
            />
          </div>
        </div>

        <div className="panel flex flex-col">
          <div className="panel-title">Remote Library</div>
          <div className="p-2 border-b border-vm-border">
            <div className="text-[10px] text-vm-muted mb-1">Status</div>
            <div className={`text-xs ${status.includes('Error') || status === 'Disconnected' ? 'text-vm-danger' : 'text-vm-success'}`}>{status}</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {syncFiles.length === 0 && receivedFiles.length === 0 && (
              <div className="h-full flex items-center justify-center text-vm-muted text-sm">No incoming files</div>
            )}
            {receivedFiles.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-vm-bg border border-vm-border rounded mb-2">
                <div className="text-xs text-vm-text truncate mr-2">{file.name}</div>
                <button onClick={() => window.electronAPI?.revealInFolder(file.path)} className="p-1 rounded hover:bg-vm-border text-vm-muted">
                  <ArrowLeftIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
            {syncFiles.map((file, i) => (
              <div key={`sync-${i}`} className="flex items-center justify-between p-2 bg-vm-bg border border-vm-border rounded mb-2">
                <div className="text-xs text-vm-text truncate mr-2">{file.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
