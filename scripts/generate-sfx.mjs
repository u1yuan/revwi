import { mkdirSync, writeFileSync } from 'node:fs'

const outputDirectory = new URL('../public/sfx/', import.meta.url)
mkdirSync(outputDirectory, { recursive: true })

const sampleRate = 22050
const cues = {
  correct: [[0, 523.25, 0.11], [0.1, 659.25, 0.13], [0.22, 783.99, 0.22]],
  incorrect: [[0, 246.94, 0.13], [0.12, 196, 0.24]],
  milestone: [[0, 523.25, 0.1], [0.08, 659.25, 0.1], [0.16, 783.99, 0.1], [0.24, 1046.5, 0.28]],
  completion: [[0, 392, 0.12], [0.1, 523.25, 0.12], [0.2, 659.25, 0.12], [0.3, 783.99, 0.32]],
}

function createWave(notes) {
  const duration = Math.max(...notes.map(([start, , length]) => start + length)) + 0.08
  const samples = Math.ceil(duration * sampleRate)
  const pcm = new Int16Array(samples)
  for (let index = 0; index < samples; index += 1) {
    const time = index / sampleRate
    let signal = 0
    for (const [start, frequency, length] of notes) {
      const local = time - start
      if (local < 0 || local > length) continue
      const attack = Math.min(1, local / 0.012)
      const release = Math.max(0, 1 - local / length) ** 1.7
      signal += Math.sin(2 * Math.PI * frequency * local) * attack * release * 0.34
      signal += Math.sin(2 * Math.PI * frequency * 2 * local) * attack * release * 0.055
    }
    pcm[index] = Math.max(-32767, Math.min(32767, Math.round(signal * 32767)))
  }

  const buffer = Buffer.alloc(44 + pcm.byteLength)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + pcm.byteLength, 4)
  buffer.write('WAVEfmt ', 8)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(pcm.byteLength, 40)
  for (let index = 0; index < pcm.length; index += 1) buffer.writeInt16LE(pcm[index], 44 + index * 2)
  return buffer
}

for (const [name, notes] of Object.entries(cues)) writeFileSync(new URL(`${name}.wav`, outputDirectory), createWave(notes))
console.log(`Generated ${Object.keys(cues).length} original WAV cues.`)
