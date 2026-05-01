<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSequencerStore } from '../stores/sequencer'
import { getEngine } from '../audio/engine'
import { TRACK_DEFINITIONS } from '../audio/tracks'

const store = useSequencerStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const NUM_BARS = 64

let raf = 0
let smoothed = new Float32Array(NUM_BARS)
let lastPlayheadStep = -1
let pulseStrength = 0

watch(
  () => store.playheadStep,
  (s) => {
    if (store.isPlaying && s !== lastPlayheadStep) {
      pulseStrength = 1
      lastPlayheadStep = s
    }
  },
)

function colorForBar(i: number): string {
  const t = i / NUM_BARS
  const idx = Math.min(TRACK_DEFINITIONS.length - 1, Math.floor(t * TRACK_DEFINITIONS.length))
  return TRACK_DEFINITIONS[idx]!.color
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) {
    raf = requestAnimationFrame(draw)
    return
  }
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  ctx.clearRect(0, 0, w, h)

  const engine = getEngine()
  let values: Float32Array | number[]
  if (engine.isReady()) {
    const raw = engine.getAnalyser().getValue()
    values = raw as Float32Array
  } else {
    values = new Float32Array(NUM_BARS)
  }

  const barCount = NUM_BARS
  const valLen = (values as Float32Array).length || 0
  for (let i = 0; i < barCount; i++) {
    let amp = 0
    if (valLen > 0 && store.isPlaying) {
      const idx = Math.floor((i / barCount) * valLen)
      const db = (values as Float32Array)[idx]!
      amp = Math.max(0, Math.min(1, (db + 100) / 80))
    } else {
      // Idle shimmer — gentle sine
      const t = performance.now() / 600
      amp = 0.04 + 0.025 * Math.sin(t + i * 0.25)
    }
    // smoothing (low-pass)
    smoothed[i] = smoothed[i]! * 0.78 + amp * 0.22
  }

  const barW = w / barCount
  for (let i = 0; i < barCount; i++) {
    const v = smoothed[i]!
    const barH = Math.max(2, v * h * 0.95)
    const x = i * barW
    const y = h - barH
    const color = colorForBar(i)
    const grad = ctx.createLinearGradient(0, y, 0, h)
    grad.addColorStop(0, color)
    grad.addColorStop(1, hexWithAlpha(color, 0.15))
    ctx.fillStyle = grad
    const inset = Math.max(0.5, barW * 0.15)
    ctx.fillRect(x + inset, y, barW - inset * 2, barH)
  }

  // Playhead pulse
  if (pulseStrength > 0) {
    ctx.globalAlpha = pulseStrength * 0.7
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, h - 1)
    ctx.lineTo(w, h - 1)
    ctx.stroke()
    ctx.globalAlpha = 1
    pulseStrength = Math.max(0, pulseStrength - 0.08)
  }

  raf = requestAnimationFrame(draw)
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')
  return hex + a
}

onMounted(() => {
  raf = requestAnimationFrame(draw)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="w-full h-[120px] bg-panel border-t border-border">
    <canvas ref="canvasRef" class="block w-full h-full" />
  </div>
</template>
