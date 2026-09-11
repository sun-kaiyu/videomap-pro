export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00:00:000'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad3(ms)}`
}

export function formatFrames(seconds: number, fps = 25): string {
  const frames = Math.floor((seconds % 1) * fps)
  return `${Math.floor(seconds)} frames ${pad(frames)}`
}

export function formatTime(seconds: number): string {
  return formatDuration(seconds)
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function pad3(n: number): string {
  return n.toString().padStart(3, '0')
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
