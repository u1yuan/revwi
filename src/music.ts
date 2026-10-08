import { getAudioGraph, peekAudioGraph, resumeAudio } from './audio-bus'
import type { Mode } from './quiz'

// "Lofi Hip Hop Loop" by omfgdude (credit name OMF-Games), CC0.
// https://opengameart.org/content/lofi-hip-hop-loop
// The file is already a full seamless loop. Low-end energy clusters on a
// 4-second phrase, so layers lock to 60 BPM. The low end sits near F.
export const MUSIC_BPM = 60
export const MUSIC_KEY = 'F minor'
export const MUSIC_ROOT = 87.31

const SOURCES = ['/music/base-loop.ogg', '/music/base-loop.mp3']
const BAR = (60 / MUSIC_BPM) * 4
const EIGHTH = 60 / MUSIC_BPM / 2
const SCALE = [349.23, 415.3, 466.16, 523.25, 622.25]
const LAYER_GAIN = { hats: 0.5, bass: 0.62, arp: 0.38, pad: 0.28 }
const THRESHOLD = { hats: 1, bass: 3, arp: 5, pad: 10 }

type LayerName = keyof typeof LAYER_GAIN

let bufferPromise: Promise<AudioBuffer | null> | null = null
let generation = 0
let running = false
let mode: Mode = 'prep'
let streak = 0
let musicLevel = 0.4
let musicEnabled = true
let origin = 0
let nextEighth = 0
let timer = 0
let noise: AudioBuffer | null = null
let baseSource: AudioBufferSourceNode | null = null
let musicGain: GainNode | null = null
let duckGain: GainNode | null = null
let baseGain: GainNode | null = null
const layers: Partial<Record<LayerName, GainNode>> = {}
let padNodes: OscillatorNode[] = []

function contextNow(): AudioContext | null {
  return peekAudioGraph()?.context ?? null
}

async function loadLoop(): Promise<AudioBuffer | null> {
  if (bufferPromise) return bufferPromise
  bufferPromise = (async () => {
    const graph = getAudioGraph()
    if (!graph || typeof graph.context.decodeAudioData !== 'function') return null
    for (const url of SOURCES) {
      try {
        const response = await fetch(url)
        if (!response.ok) continue
        return await graph.context.decodeAudioData(await response.arrayBuffer())
      } catch { /* try the next format */ }
    }
    return null
  })()
  return bufferPromise
}

function ramp(param: AudioParam, target: number, seconds: number) {
  const audio = contextNow()
  if (!audio) return
  const now = audio.currentTime
  param.cancelScheduledValues(now)
  param.setValueAtTime(param.value, now)
  param.linearRampToValueAtTime(target, now + seconds)
}

function ensureNoise(audio: AudioContext) {
  if (noise) return noise
  const length = audio.sampleRate
  noise = audio.createBuffer(1, length, audio.sampleRate)
  const data = noise.getChannelData(0)
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1
  return noise
}

function activeStreak(): number {
  return mode === 'exam' ? 0 : streak
}

function scheduleHat(audio: AudioContext, time: number, accent: boolean) {
  const hats = layers.hats
  if (!hats) return
  const source = audio.createBufferSource()
  source.buffer = ensureNoise(audio)
  const filter = audio.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.setValueAtTime(accent ? 5200 : 6800, time)
  const gain = audio.createGain()
  const peak = accent ? 0.2 : 0.11
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(hats)
  source.start(time)
  source.stop(time + 0.06)
}

function scheduleTone(audio: AudioContext, time: number, frequency: number, duration: number, type: OscillatorType, peak: number, destination: GainNode) {
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, time)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
  oscillator.connect(gain)
  gain.connect(destination)
  oscillator.start(time)
  oscillator.stop(time + duration + 0.02)
}

function syncPad(audio: AudioContext) {
  const pad = layers.pad
  const wanted = activeStreak() >= THRESHOLD.pad && running
  if (!wanted) {
    padNodes.forEach((node) => { try { node.stop() } catch { /* already stopped */ } })
    padNodes = []
    return
  }
  if (padNodes.length || !pad) return
  for (const frequency of [174.61, 261.63]) {
    const oscillator = audio.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime)
    oscillator.connect(pad)
    oscillator.start()
    padNodes.push(oscillator)
  }
}

function scheduleAhead() {
  const graph = peekAudioGraph()
  if (!graph || !running) return
  const horizon = graph.context.currentTime + 0.18
  const level = activeStreak()
  while (origin + nextEighth * EIGHTH < horizon) {
    const time = origin + nextEighth * EIGHTH
    const step = nextEighth % 8
    if (time >= graph.context.currentTime - 0.02) {
      if (level >= THRESHOLD.hats) scheduleHat(graph.context, time, step % 2 === 0)
      if (level >= THRESHOLD.bass && layers.bass && step % 4 === 0) scheduleTone(graph.context, time, MUSIC_ROOT, 0.42, 'sine', 0.2, layers.bass)
      if (level >= THRESHOLD.arp && layers.arp) scheduleTone(graph.context, time, SCALE[step % SCALE.length], 0.28, 'triangle', 0.08, layers.arp)
    }
    nextEighth += 1
  }
  syncPad(graph.context)
}

function applyLayers() {
  const level = activeStreak()
  ;(Object.keys(LAYER_GAIN) as LayerName[]).forEach((name) => {
    const gain = layers[name]
    if (!gain) return
    const target = level >= THRESHOLD[name] ? LAYER_GAIN[name] : 0
    const opening = target > gain.gain.value + 0.001
    ramp(gain.gain, target, opening ? BAR : 0.5)
  })
}

export function setMusicVolume(level: number, enabled: boolean) {
  musicLevel = Math.min(1, Math.max(0, level))
  musicEnabled = enabled && musicLevel > 0
  if (musicGain) ramp(musicGain.gain, musicEnabled ? musicLevel : 0, 0.2)
}

export function setMusicTier(nextStreak: number) {
  streak = Math.max(0, nextStreak)
  applyLayers()
}

export function setMusicMode(nextMode: Mode) {
  mode = nextMode
  applyLayers()
}

export function duckMusic(kind: 'soft' | 'hard' | 'volume' = 'soft') {
  if (kind === 'volume' || !duckGain) return
  const audio = contextNow()
  if (!audio) return
  const now = audio.currentTime
  const dip = kind === 'hard' ? 0.4 : 0.76
  const recover = kind === 'hard' ? 0.5 : 0.22
  duckGain.gain.cancelScheduledValues(now)
  duckGain.gain.setValueAtTime(duckGain.gain.value, now)
  duckGain.gain.linearRampToValueAtTime(dip, now + 0.03)
  duckGain.gain.linearRampToValueAtTime(1, now + recover)
}

function buildBuses(audio: AudioContext, destination: AudioNode) {
  musicGain = audio.createGain()
  duckGain = audio.createGain()
  baseGain = audio.createGain()
  const mix = audio.createGain()
  musicGain.gain.setValueAtTime(musicEnabled ? musicLevel : 0, audio.currentTime)
  duckGain.gain.setValueAtTime(1, audio.currentTime)
  baseGain.gain.setValueAtTime(0, audio.currentTime)
  ;(Object.keys(LAYER_GAIN) as LayerName[]).forEach((name) => {
    const gain = audio.createGain()
    gain.gain.setValueAtTime(0, audio.currentTime)
    gain.connect(mix)
    layers[name] = gain
  })
  baseGain.connect(mix)
  mix.connect(duckGain)
  duckGain.connect(musicGain)
  musicGain.connect(destination)
}

export function stopMusic() {
  generation += 1
  running = false
  if (timer) window.clearInterval(timer)
  timer = 0
  const source = baseSource
  baseSource = null
  if (musicGain) ramp(musicGain.gain, 0, 0.55)
  padNodes.forEach((node) => { try { node.stop() } catch { /* already stopped */ } })
  padNodes = []
  window.setTimeout(() => { try { source?.stop() } catch { /* already stopped */ } }, 580)
}

export async function startMusic(nextMode: Mode): Promise<boolean> {
  mode = nextMode
  const graph = getAudioGraph()
  if (!graph) return false
  resumeAudio()
  if (running) {
    applyLayers()
    return true
  }
  const token = ++generation
  try {
    const buffer = await loadLoop()
    if (!buffer || token !== generation) return false
    const current = peekAudioGraph()
    if (!current) return false
    if (!musicGain || !baseGain) buildBuses(current.context, current.musicBus)
    const source = current.context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.connect(baseGain!)
    origin = current.context.currentTime + 0.06
    nextEighth = 0
    source.start(origin)
    baseSource = source
    ramp(baseGain!.gain, 1, 0.8)
    if (musicGain) ramp(musicGain.gain, musicEnabled ? musicLevel : 0, 0.2)
    running = true
    applyLayers()
    if (timer) window.clearInterval(timer)
    timer = window.setInterval(scheduleAhead, 25)
    scheduleAhead()
    return true
  } catch {
    return false
  }
}
