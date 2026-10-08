import type { Preferences } from './quiz'

export type AudioGraph = {
  context: AudioContext
  master: GainNode
  musicBus: GainNode
  sfxBus: GainNode
}

let context: AudioContext | null = null
let master: GainNode | null = null
let musicBus: GainNode | null = null
let sfxBus: GainNode | null = null
let pending: Preferences | null = null

function note(event: string) {
  const events = (window as unknown as { __audioEvents?: string[] }).__audioEvents
  events?.push(event)
}

export function peekAudioGraph(): AudioGraph | null {
  if (!context || !master || !musicBus || !sfxBus) return null
  return { context, master, musicBus, sfxBus }
}

function apply(preferences: Preferences, graph: AudioGraph) {
  const now = graph.context.currentTime
  const set = (gain: AudioParam, value: number) => {
    gain.cancelScheduledValues(now)
    if (typeof gain.setTargetAtTime === 'function') gain.setTargetAtTime(value, now, 0.03)
    else gain.setValueAtTime(value, now)
  }
  set(graph.master.gain, preferences.master)
  set(graph.sfxBus.gain, preferences.sfxOn ? preferences.sfx : 0)
}

export function rememberPreferences(preferences: Preferences) {
  pending = preferences
  const graph = peekAudioGraph()
  if (graph) apply(preferences, graph)
}

export function getAudioGraph(): AudioGraph | null {
  const existing = peekAudioGraph()
  if (existing) return existing
  const Constructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Constructor) return null
  context = new Constructor()
  master = context.createGain()
  musicBus = context.createGain()
  sfxBus = context.createGain()
  musicBus.connect(master)
  sfxBus.connect(master)
  master.connect(context.destination)
  const graph = { context, master, musicBus, sfxBus }
  if (pending) apply(pending, graph)
  return graph
}

export function resumeAudio() {
  const graph = peekAudioGraph()
  if (graph && graph.context.state === 'suspended') {
    note('context:resume')
    void graph.context.resume()
  }
}

export function markAudio(event: string) {
  note(event)
}
