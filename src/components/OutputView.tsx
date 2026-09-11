import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export function OutputView({ layerId }: { layerId: string }) {
  const layers = useAppStore(s => s.layers)
  const layer = layers.find(l => l.id === layerId)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [command, setCommand] = useState<{ command: string; payload: any } | null>(null)

  useEffect(() => {
    if (!window.electronAPI) return
    const unsub = window.electronAPI.onOutputCommand((data: any) => {
      setCommand(data)
      if (data.command === 'play' && videoRef.current) videoRef.current.play().catch(() => {})
      if (data.command === 'pause' && videoRef.current) videoRef.current.pause()
      if (data.command === 'stop' && videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!videoRef.current || !layer) return
    const v = videoRef.current
    if (v.src !== `file://${layer.videoPath}`) {
      v.src = `file://${layer.videoPath}`
      v.currentTime = layer.currentTime
    }
    if (layer.playing) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [layer?.videoPath, layer?.playing])

  useEffect(() => {
    if (videoRef.current && layer && Math.abs(videoRef.current.currentTime - layer.currentTime) > 0.2) {
      videoRef.current.currentTime = layer.currentTime
    }
  }, [layer?.currentTime])

  if (!layer) return <div className="w-full h-full bg-black text-white flex items-center justify-center">No layer</div>

  return (
    <div className="w-full h-full bg-black overflow-hidden">
      {layer.videoPath ? (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          muted
          playsInline
          loop={layer.loop}
          autoPlay={layer.playing}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-vm-muted text-sm">
          No video assigned to {layer.name}
        </div>
      )}
    </div>
  )
}
