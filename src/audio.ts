import { getAudioGraph, markAudio, peekAudioGraph, rememberPreferences, resumeAudio } from './audio-bus'
import { duckMusic, setMusicVolume } from './music'
import type { Preferences } from './quiz'

export type Cue = 'mode' | 'select' | 'deselect' | 'neutral' | 'continue' | 'skip' | 'mute' | 'unmute' | 'correct' | 'incorrect' | 'milestone' | 'completion'
type ToneCue = Exclude<Cue, 'correct' | 'incorrect' | 'milestone' | 'completion'>

const fileCues: Partial<Record<Cue, string>> = {
  correct: '/sfx/correct.wav',
  incorrect: '/sfx/incorrect.wav',
  milestone: '/sfx/milestone.wav',
  completion: '/sfx/completion.wav',
}

const toneCues: Record<ToneCue, [number, number, OscillatorType]> = {
  mode: [392, 0.08, 'sine'],
  select: [620, 0.055, 'sine'],
  deselect: [410, 0.055, 'sine'],
  neutral: [520, 0.07, 'triangle'],
  continue: [700, 0.06, 'sine'],
  skip: [300, 0.09, 'triangle'],
  mute: [260, 0.06, 'sine'],
  unmute: [560, 0.07, 'sine'],
}

const buffers = new Map<string, Promise<AudioBuffer | null>>()
const active = new Set<AudioScheduledSourceNode>()

function audible(preferences: Preferences): boolean {
  return preferences.sfxOn && preferences.sfx > 0 && preferences.master > 0
}

function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const existing = buffers.get(url)
  if (existing) return existing
  const pending = (async () => {
    const graph = getAudioGraph()
    if (!graph || typeof graph.context.decodeAudioData !== 'function') return null
    const response = await fetch(url)
    if (!response.ok) return null
    return graph.context.decodeAudioData(await response.arrayBuffer())
  })().catch(() => null)
  buffers.set(url, pending)
  return pending
}

export function preloadCues(): void {
  for (const file of Object.values(fileCues)) if (file) void loadBuffer(file)
}

export function stopAudio(): void {
  markAudio('sfx:stop')
  active.forEach((node) => {
    try { node.stop() } catch { /* already stopped */ }
  })
  active.clear()
}

export function syncAudioPreferences(preferences: Preferences): void {
  rememberPreferences(preferences)
  setMusicVolume(preferences.music, preferences.musicOn && preferences.master > 0)
  if (!audible(preferences)) stopAudio()
}

function track(node: AudioScheduledSourceNode) {
  active.add(node)
  if (typeof node.addEventListener === 'function') node.addEventListener('ended', () => active.delete(node), { once: true })
}

export function playCue(cue: Cue, preferences: Preferences): void {
  if (!audible(preferences)) return
  rememberPreferences(preferences)
  const graph = getAudioGraph()
  if (!graph) return
  resumeAudio()
  duckMusic(fileCues[cue] ? 'hard' : 'soft')

  const file = fileCues[cue]
  if (file) {
    void loadBuffer(file).then((buffer) => {
      const current = peekAudioGraph()
      if (!buffer || !current || current.sfxBus.gain.value === 0) return
      const source = current.context.createBufferSource()
      source.buffer = buffer
      source.connect(current.sfxBus)
      track(source)
      markAudio(`media:play:${file}`)
      source.start()
    })
    return
  }

  const [frequency, duration, type] = toneCues[cue as ToneCue]
  const oscillator = graph.context.createOscillator()
  const gain = graph.context.createGain()
  const now = graph.context.currentTime
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, now)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  oscillator.connect(gain)
  gain.connect(graph.sfxBus)
  track(oscillator)
  oscillator.start(now)
  oscillator.stop(now + duration + 0.01)
}
