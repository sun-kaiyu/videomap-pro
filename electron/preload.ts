import { contextBridge, ipcRenderer } from 'electron'

export interface IElectronAPI {
  getDisplays: () => Promise<any[]>
  openOutputWindow: (options: any) => Promise<{ id: number }>
  closeOutputWindow: (id: number) => Promise<void>
  selectVideo: () => Promise<string[]>
  selectOutputDir: () => Promise<string | null>
  openPath: (path: string) => Promise<void>
  revealInFolder: (path: string) => Promise<void>
  transcode: (args: any) => Promise<any>
  cancelTranscode: () => Promise<void>
  getVideoInfo: (filePath: string) => Promise<any>
  syncStartServer: () => Promise<any>
  syncSendFile: (params: any) => Promise<any>
  getLocalIPs: () => Promise<string[]>
  getVersion: () => Promise<string>
  sendToOutput: (params: any) => Promise<void>
  getAppConfig: () => Promise<any>
  listPresets: () => Promise<string[]>
  onTranscodeProgress: (cb: (data: any) => void) => () => void
  onSyncFileReceived: (cb: (data: any) => void) => () => void
  onSyncServerReady: (cb: (data: any) => void) => () => void
  onOutputCommand: (cb: (data: any) => void) => () => void
}

const api: IElectronAPI = {
  getDisplays: () => ipcRenderer.invoke('vm:get-displays'),
  openOutputWindow: (options) => ipcRenderer.invoke('vm:open-output-window', options),
  closeOutputWindow: (id) => ipcRenderer.invoke('vm:close-output-window', id),
  selectVideo: () => ipcRenderer.invoke('vm:select-video'),
  selectOutputDir: () => ipcRenderer.invoke('vm:select-output-dir'),
  openPath: (path) => ipcRenderer.invoke('vm:open-path', path),
  revealInFolder: (path) => ipcRenderer.invoke('vm:reveal-in-folder', path),
  transcode: (args) => ipcRenderer.invoke('vm:transcode', args),
  cancelTranscode: () => ipcRenderer.invoke('vm:cancel-transcode'),
  getVideoInfo: (filePath) => ipcRenderer.invoke('vm:get-video-info', filePath),
  syncStartServer: () => ipcRenderer.invoke('vm:sync-start-server'),
  syncSendFile: (params) => ipcRenderer.invoke('vm:sync-send-file', params),
  getLocalIPs: () => ipcRenderer.invoke('vm:get-local-ips'),
  getVersion: () => ipcRenderer.invoke('vm:get-version'),
  sendToOutput: (params) => ipcRenderer.invoke('vm:send-to-output', params),
  getAppConfig: () => ipcRenderer.invoke('vm:get-app-config'),
  listPresets: () => ipcRenderer.invoke('vm:list-presets'),
  onTranscodeProgress: (cb) => {
    const fn = (_: any, data: any) => cb(data)
    ipcRenderer.on('vm:transcode-progress', fn)
    return () => ipcRenderer.removeListener('vm:transcode-progress', fn)
  },
  onSyncFileReceived: (cb) => {
    const fn = (_: any, data: any) => cb(data)
    ipcRenderer.on('vm:sync-file-received', fn)
    return () => ipcRenderer.removeListener('vm:sync-file-received', fn)
  },
  onSyncServerReady: (cb) => {
    const fn = (_: any, data: any) => cb(data)
    ipcRenderer.on('vm:sync-server-ready', fn)
    return () => ipcRenderer.removeListener('vm:sync-server-ready', fn)
  },
  onOutputCommand: (cb) => {
    const fn = (_: any, data: any) => cb(data)
    ipcRenderer.on('vm:output-command', fn)
    return () => ipcRenderer.removeListener('vm:output-command', fn)
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)
