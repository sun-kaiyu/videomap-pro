import { app, BrowserWindow, screen, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import os from 'os'
import net from 'net'

let mainWindow: BrowserWindow | null = null
let outputWindows: BrowserWindow[] = []

// 资源目录：打包后指向 <install>/resources，开发时指向项目根 resources
// 注意：绝不能用 process.cwd()，快捷方式启动会导致工作目录变化
function getResourcesDir(): string {
  return app.isPackaged ? process.resourcesPath : path.join(app.getAppPath(), 'resources')
}

// 解析 ffmpeg：优先使用随包分发的二进制，其次回落到系统 PATH
function resolveFFmpeg(): string {
  const bundled = path.join(getResourcesDir(), 'ffmpeg', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
  if (fs.existsSync(bundled)) return bundled
  return 'ffmpeg'
}

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  mainWindow = new BrowserWindow({
    width: Math.min(1600, width),
    height: Math.min(1000, height),
    minWidth: 1280,
    minHeight: 720,
    title: 'VideoMap Pro',
    backgroundColor: '#0f1115',
    // 窗口图标：打包后从 app.asar 内读取，开发时指向项目 build 目录
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  outputWindows.forEach(w => { if (!w.isDestroyed()) w.destroy() })
  outputWindows = []
  if (process.platform !== 'darwin') app.quit()
})

// === Display detection ===
ipcMain.handle('vm:get-displays', () => {
  return screen.getAllDisplays().map((d, i) => ({
    id: d.id,
    index: i,
    name: `Display ${i + 1}`,
    label: d.label || `Display ${i + 1}`,
    bounds: d.bounds,
    workArea: d.workArea,
    size: d.size,
    scaleFactor: d.scaleFactor,
    isPrimary: d.id === screen.getPrimaryDisplay().id
  }))
})

ipcMain.handle('vm:open-output-window', async (_, options) => {
  const displays = screen.getAllDisplays()
  const targetDisplay = displays.find(d => d.id === options.displayId) || screen.getPrimaryDisplay()

  const win = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: options.width || targetDisplay.bounds.width,
    height: options.height || targetDisplay.bounds.height,
    frame: false,
    fullscreen: options.fullscreen !== false,
    resizable: false,
    movable: false,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: `#/output/${options.layerId}` })
  } else {
    win.loadURL(`http://localhost:5173#/output/${options.layerId}`)
  }

  win.on('closed', () => {
    outputWindows = outputWindows.filter(w => w !== win)
  })

  outputWindows.push(win)
  return { id: win.id }
})

ipcMain.handle('vm:close-output-window', async (_, id) => {
  const win = outputWindows.find(w => w.id === id)
  if (win && !win.isDestroyed()) win.close()
})

// === File dialogs ===
ipcMain.handle('vm:select-video', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv', 'mxf', 'prores', 'webm'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result.filePaths || []
})

ipcMain.handle('vm:select-output-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  return result.filePaths[0] || null
})

ipcMain.handle('vm:open-path', async (_, filePath) => {
  shell.openPath(filePath)
})

ipcMain.handle('vm:reveal-in-folder', async (_, filePath) => {
  shell.showItemInFolder(filePath)
})

// === 附加数据文件（extraResources）读取 ===
// 打包后这些文件位于 <install>/resources/<to>/...，不在 asar 内，可读写
ipcMain.handle('vm:get-app-config', async () => {
  const defaults = { ffmpegPath: '', defaultOutputDir: '', maxLayers: 6 }
  try {
    const cfgPath = path.join(getResourcesDir(), 'config', 'app-config.json')
    if (fs.existsSync(cfgPath)) {
      return { ...defaults, ...JSON.parse(fs.readFileSync(cfgPath, 'utf-8')) }
    }
  } catch (e) {
    console.error('Failed to read app config', e)
  }
  return defaults
})

ipcMain.handle('vm:list-presets', async () => {
  try {
    const dir = path.join(getResourcesDir(), 'presets')
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
  } catch {
    return []
  }
})

// === FFmpeg transcoding ===
let activeFFmpeg: ReturnType<typeof spawn> | null = null

ipcMain.handle('vm:transcode', async (_, args) => {
  const { input, output, params } = args
  if (!fs.existsSync(input)) throw new Error('Input file not found')

  const useFFmpeg = resolveFFmpeg()

  return new Promise((resolve, reject) => {
    // windowsHide: 禁止子进程弹出黑色控制台窗口（ffmpeg 转码时必现）
    activeFFmpeg = spawn(useFFmpeg, [
      '-y',
      '-i', input,
      ...(params || []),
      output
    ], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, shell: false })

    let stderr = ''
    activeFFmpeg.stderr?.on('data', (data) => {
      stderr += data.toString()
      const match = data.toString().match(/time=(\d+:\d+:\d+\.\d+)/)
      if (match && mainWindow) {
        mainWindow.webContents.send('vm:transcode-progress', { time: match[1] })
      }
    })

    activeFFmpeg.on('close', (code) => {
      activeFFmpeg = null
      if (code === 0) resolve({ success: true, output })
      else reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`))
    })

    activeFFmpeg.on('error', (err) => {
      activeFFmpeg = null
      reject(err)
    })
  })
})

ipcMain.handle('vm:cancel-transcode', () => {
  if (activeFFmpeg) {
    activeFFmpeg.kill('SIGKILL')
    activeFFmpeg = null
  }
})

ipcMain.handle('vm:get-video-info', async (_, filePath) => {
  const useFFmpeg = resolveFFmpeg()

  return new Promise((resolve, reject) => {
    const probe = spawn(useFFmpeg, ['-i', filePath], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, shell: false })
    let stderr = ''
    probe.stderr?.on('data', d => { stderr += d.toString() })
    probe.on('close', () => {
      const durationMatch = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
      const streamMatch = stderr.match(/Stream #0:\d+.*?Video:.*?(\d+x\d+)/)
      const fpsMatch = stderr.match(/(\d+(?:\.\d+)?) fps/)
      if (durationMatch) {
        const h = parseInt(durationMatch[1])
        const m = parseInt(durationMatch[2])
        const s = parseFloat(durationMatch[3])
        resolve({
          duration: h * 3600 + m * 60 + s,
          resolution: streamMatch ? streamMatch[1] : null,
          fps: fpsMatch ? parseFloat(fpsMatch[1]) : null
        })
      } else {
        resolve({ duration: 0, resolution: null, fps: null })
      }
    })
    probe.on('error', reject)
  })
})

// === LAN Sync (simple TCP file transfer) ===
let syncServer: net.Server | null = null
const syncPeers = new Map<string, net.Socket>()
const SYNC_PORT = 19191

function getLocalIPs() {
  const interfaces = os.networkInterfaces()
  const ips: string[] = []
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address)
    }
  }
  return ips
}

ipcMain.handle('vm:sync-start-server', () => {
  if (syncServer) return { started: true, port: SYNC_PORT, ips: getLocalIPs() }

  syncServer = net.createServer(socket => {
    let headerBuffer = Buffer.alloc(0)
    let expectedLength = 0
    let filePath = ''
    let writeStream: fs.WriteStream | null = null

    socket.on('data', data => {
      if (expectedLength === 0) {
        headerBuffer = Buffer.concat([headerBuffer, data])
        const newline = headerBuffer.indexOf('\n')
        if (newline !== -1) {
          const header = headerBuffer.slice(0, newline).toString()
          const [name, size] = header.split('|')
          filePath = path.join(os.tmpdir(), name)
          writeStream = fs.createWriteStream(filePath)
          expectedLength = parseInt(size)
          const remaining = headerBuffer.slice(newline + 1)
          if (remaining.length) writeStream.write(remaining)
        }
      } else {
        if (writeStream) {
          writeStream.write(data)
          expectedLength -= data.length
          if (expectedLength <= 0) {
            writeStream.end()
            socket.end()
            mainWindow?.webContents.send('vm:sync-file-received', { path: filePath, name: path.basename(filePath) })
          }
        }
      }
    })

    socket.on('end', () => {
      syncPeers.delete(socket.remoteAddress || '')
    })
  })

  syncServer.listen(SYNC_PORT, '0.0.0.0', () => {
    mainWindow?.webContents.send('vm:sync-server-ready', { port: SYNC_PORT })
  })

  return { started: true, port: SYNC_PORT, ips: getLocalIPs() }
})

ipcMain.handle('vm:sync-send-file', async (_, { host, filePath }) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    socket.connect(SYNC_PORT, host, () => {
      const stat = fs.statSync(filePath)
      const name = path.basename(filePath)
      socket.write(`${name}|${stat.size}\n`)
      const readStream = fs.createReadStream(filePath)
      readStream.pipe(socket)
      readStream.on('end', () => resolve({ success: true }))
      readStream.on('error', reject)
    })
    socket.on('error', reject)
  })
})

ipcMain.handle('vm:get-local-ips', () => getLocalIPs())

// === App metadata ===
ipcMain.handle('vm:get-version', () => app.getVersion())

// === Output renderer bridge ===
ipcMain.handle('vm:send-to-output', async (_, { windowId, command, payload }) => {
  const win = outputWindows.find(w => w.id === windowId)
  if (win && !win.isDestroyed()) {
    win.webContents.send('vm:output-command', { command, payload })
  }
})
