// Generates royalty-free drum samples as 16-bit PCM mono WAVs
// into public/samples/. No external deps; pure Node + DSP.
//
// Run: npm run gen-samples
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '..', 'public', 'samples')
mkdirSync(outDir, { recursive: true })

const SR = 44100

// ---- WAV writer (16-bit PCM, mono) ----
function writeWav(path, floatSamples) {
  const numSamples = floatSamples.length
  const byteRate = SR * 2
  const blockAlign = 2
  const dataSize = numSamples * 2
  const buf = Buffer.alloc(44 + dataSize)
  let p = 0
  buf.write('RIFF', p); p += 4
  buf.writeUInt32LE(36 + dataSize, p); p += 4
  buf.write('WAVE', p); p += 4
  buf.write('fmt ', p); p += 4
  buf.writeUInt32LE(16, p); p += 4              // fmt chunk size
  buf.writeUInt16LE(1, p); p += 2               // PCM
  buf.writeUInt16LE(1, p); p += 2               // channels
  buf.writeUInt32LE(SR, p); p += 4
  buf.writeUInt32LE(byteRate, p); p += 4
  buf.writeUInt16LE(blockAlign, p); p += 2
  buf.writeUInt16LE(16, p); p += 2              // bits per sample
  buf.write('data', p); p += 4
  buf.writeUInt32LE(dataSize, p); p += 4
  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, floatSamples[i]))
    buf.writeInt16LE(Math.round(s * 32767), p)
    p += 2
  }
  writeFileSync(path, buf)
  console.log(`  wrote ${path} (${(dataSize / 1024).toFixed(1)} KB)`)
}

// ---- DSP helpers ----
function alloc(seconds) {
  return new Float32Array(Math.floor(seconds * SR))
}
function expEnv(t, decay) {
  return Math.exp(-t * decay)
}
function whiteNoise() {
  return Math.random() * 2 - 1
}
function softClip(x) {
  return Math.tanh(x * 1.2)
}
// Simple 1-pole low-pass (cutoff in Hz)
function lowpass(buf, cutoff) {
  const dt = 1 / SR
  const rc = 1 / (2 * Math.PI * cutoff)
  const a = dt / (rc + dt)
  let y = 0
  for (let i = 0; i < buf.length; i++) {
    y = y + a * (buf[i] - y)
    buf[i] = y
  }
  return buf
}
// Simple 1-pole high-pass
function highpass(buf, cutoff) {
  const dt = 1 / SR
  const rc = 1 / (2 * Math.PI * cutoff)
  const a = rc / (rc + dt)
  let prevX = 0, prevY = 0
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i]
    const y = a * (prevY + x - prevX)
    prevX = x
    prevY = y
    buf[i] = y
  }
  return buf
}

// ---- Drum voices ----
function genKick() {
  const buf = alloc(0.45)
  // Pitch sweep from ~110Hz to ~45Hz, fast amplitude decay
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR
    const f = 45 + (110 - 45) * Math.exp(-t * 28)
    const phase = 2 * Math.PI * f * t * (1 + 0)
    const click = expEnv(t, 600) * whiteNoise() * 0.3
    const body = Math.sin(phase) * expEnv(t, 8)
    buf[i] = softClip((body + click) * 1.1)
  }
  return buf
}

function genSnare() {
  const buf = alloc(0.25)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR
    // Two body tones around 180/330 Hz + filtered noise
    const tone =
      0.4 * Math.sin(2 * Math.PI * 180 * t) * expEnv(t, 30) +
      0.3 * Math.sin(2 * Math.PI * 330 * t) * expEnv(t, 35)
    const noise = whiteNoise() * expEnv(t, 18)
    buf[i] = tone + noise
  }
  highpass(buf, 600)
  // Slight body boost via lowpass copy summed in (faked)
  return buf.map((v) => softClip(v * 0.9))
}

function genHihatClosed() {
  const buf = alloc(0.08)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR
    buf[i] = whiteNoise() * expEnv(t, 90)
  }
  highpass(buf, 7000)
  return buf.map((v) => v * 0.6)
}

function genHihatOpen() {
  const buf = alloc(0.45)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR
    buf[i] = whiteNoise() * expEnv(t, 8)
  }
  highpass(buf, 6000)
  return buf.map((v) => v * 0.55)
}

function genClap() {
  // Three quick noise bursts then a longer tail
  const buf = alloc(0.3)
  const bursts = [0, 0.012, 0.024]
  const tailStart = 0.036
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR
    let v = 0
    for (const b of bursts) {
      const dt = t - b
      if (dt >= 0 && dt < 0.02) v += whiteNoise() * expEnv(dt, 220)
    }
    const tdt = t - tailStart
    if (tdt >= 0) v += whiteNoise() * expEnv(tdt, 18) * 0.7
    buf[i] = v
  }
  highpass(buf, 1200)
  lowpass(buf, 5000)
  return buf.map((v) => softClip(v * 1.3))
}

function genTom() {
  const buf = alloc(0.4)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR
    const f = 90 + (160 - 90) * Math.exp(-t * 10)
    buf[i] = Math.sin(2 * Math.PI * f * t) * expEnv(t, 6)
  }
  return buf.map((v) => softClip(v * 0.9))
}

function genPerc() {
  // Metallic short tick — sum of inharmonic sines
  const buf = alloc(0.18)
  const partials = [320, 540, 870, 1320, 1830]
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR
    let v = 0
    for (const f of partials) v += Math.sin(2 * Math.PI * f * t)
    v = (v / partials.length) * expEnv(t, 35)
    buf[i] = v
  }
  highpass(buf, 500)
  return buf.map((v) => softClip(v * 1.0))
}

const samples = {
  'kick.wav': genKick(),
  'snare.wav': genSnare(),
  'hihat-closed.wav': genHihatClosed(),
  'hihat-open.wav': genHihatOpen(),
  'clap.wav': genClap(),
  'tom.wav': genTom(),
  'perc.wav': genPerc(),
}

console.log(`Generating samples → ${outDir}`)
for (const [name, data] of Object.entries(samples)) {
  writeWav(resolve(outDir, name), data)
}
console.log('Done.')
