import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { PlusIcon, FolderIcon, TrashIcon, PlayIcon } from '@heroicons/react/24/solid'

export function TranscoderPanel() {
  const [files, setFiles] = useState<{ path: string; name: string; duration: number }[]>([])
  const [outputDir, setOutputDir] = useState('')
  const [format, setFormat] = useState('mp4')
  const [codec, setCodec] = useState('libx264')
  const [progress, setProgress] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const progressRef = useRef<string | null>(null)

  useEffect(() => {
    if (!window.electronAPI) return
    const unsub = window.electronAPI.onTranscodeProgress((data: any) => {
      progressRef.current = data.time
      setProgress(data.time)
    })
    return unsub
  }, [])

  const addFiles = async () => {
    if (!window.electronAPI) return
    const paths = await window.electronAPI.selectVideo()
    const newFiles = []
    for (const path of paths) {
      const info = await window.electronAPI.getVideoInfo(path)
      newFiles.push({ path, name: path.split(/[\\/]/).pop() || path, duration: info.duration })
    }
    setFiles(prev => [...prev, ...newFiles])
  }

  const chooseOutput = async () => {
    if (!window.electronAPI) return
    const dir = await window.electronAPI.selectOutputDir()
    if (dir) setOutputDir(dir)
  }

  const startConvert = async () => {
    if (!window.electronAPI || files.length === 0 || !outputDir) return
    for (const file of files) {
      const output = `${outputDir}\\${file.name.replace(/\.[^.]+$/, '')}_converted.${format}`
      const params = ['-c:v', codec, '-crf', '23', '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k']
      try {
        setProgress('00:00:00.000')
        await window.electronAPI.transcode({ input: file.path, output, params })
        setLogs(prev => [...prev, `OK: ${output}`])
      } catch (err: any) {
        setLogs(prev => [...prev, `ERR: ${file.name} - ${err.message}`])
      }
    }
    setProgress(null)
  }

  const cancel = () => {
    window.electronAPI?.cancelTranscode()
  }

  const removeFile = (path: string) => {
    setFiles(prev => prev.filter(f => f.path !== path))
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-vm-text">SAGA ENCODER</h2>
        <div className="flex gap-2">
          <button onClick={addFiles} className="btn btn-secondary flex items-center gap-1">
            <PlusIcon className="w-3 h-3" /> Add Movie
          </button>
          <button onClick={chooseOutput} className="btn btn-secondary flex items-center gap-1">
            <FolderIcon className="w-3 h-3" /> Output Folder
          </button>
          <button onClick={startConvert} className="btn btn-primary flex items-center gap-1">
            <PlayIcon className="w-3 h-3" /> Convert
          </button>
          <button onClick={cancel} className="btn btn-secondary">Cancel</button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div>
          <label className="text-xs text-vm-muted block mb-1">Format</label>
          <select value={format} onChange={e => setFormat(e.target.value)} className="w-32">
            <option value="mp4">MP4</option>
            <option value="mov">MOV</option>
            <option value="mkv">MKV</option>
            <option value="webm">WebM</option>
            <option value="avi">AVI</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-vm-muted block mb-1">Video Codec</label>
          <select value={codec} onChange={e => setCodec(e.target.value)} className="w-40">
            <option value="libx264">H.264</option>
            <option value="libx265">H.265 / HEVC</option>
            <option value="libvpx-vp9">VP9</option>
            <option value="prores">ProRes</option>
            <option value="copy">Copy stream</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-vm-muted block mb-1">Output Directory</label>
          <div className="text-xs text-vm-text bg-vm-bg border border-vm-border rounded px-2 py-1 truncate">
            {outputDir || 'Not selected'}
          </div>
        </div>
      </div>

      <div className="flex-1 panel overflow-hidden flex flex-col">
        <div className="panel-title">Queue</div>
        <div className="flex-1 overflow-y-auto p-2">
          {files.length === 0 && (
            <div className="h-full flex items-center justify-center text-vm-muted text-sm">
              Click to add movie
            </div>
          )}
          {files.map(file => (
            <div key={file.path} className="flex items-center justify-between p-2 bg-vm-bg border border-vm-border rounded mb-2">
              <div>
                <div className="text-xs text-vm-text">{file.name}</div>
                <div className="text-[10px] text-vm-muted">{file.duration ? `${file.duration.toFixed(2)}s` : 'Unknown duration'}</div>
              </div>
              <button onClick={() => removeFile(file.path)} className="p-1 rounded hover:bg-vm-danger hover:text-white text-vm-muted">
                <TrashIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {progress && (
        <div className="mt-2 text-xs text-vm-accent">Encoding progress: {progress}</div>
      )}

      {logs.length > 0 && (
        <div className="mt-2 h-32 panel overflow-hidden flex flex-col">
          <div className="panel-title">Logs</div>
          <div className="flex-1 overflow-y-auto p-2 text-[10px] font-mono text-vm-muted">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}
