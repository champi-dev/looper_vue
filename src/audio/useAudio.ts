import { watch } from 'vue'
import { useSequencerStore } from '../stores/sequencer'
import { getEngine } from './engine'

let installed = false

/**
 * Wires the Pinia store to the AudioEngine. Idempotent.
 * Call once from App.vue after store.init().
 */
export function installAudioBridge() {
  if (installed) return
  installed = true
  const store = useSequencerStore()
  const engine = getEngine()

  // Push current pattern → engine on any pattern change
  watch(
    () => store.currentPattern,
    (p) => {
      if (engine.isReady()) engine.setPattern(p)
    },
    { deep: true, immediate: false },
  )
}

/** Lazy-init audio on first user gesture, then start. */
export async function ensureAudioReady(): Promise<void> {
  const store = useSequencerStore()
  const engine = getEngine()
  if (!engine.isReady()) {
    await engine.init()
    engine.setPattern(store.currentPattern)
    engine.scheduleSequence((stepIndex) => store.setPlayheadStep(stepIndex))
    store.setAudioReady(true)
  }
}

export async function playToggle() {
  const store = useSequencerStore()
  const engine = getEngine()
  await ensureAudioReady()
  if (store.isPlaying) {
    engine.stop()
    store.setPlaying(false)
    store.setPlayheadStep(0)
  } else {
    engine.setPattern(store.currentPattern)
    engine.start()
    store.setPlaying(true)
  }
}
