import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Pattern, PersistedState, TrackId } from '../types'
import { defaultTrackStates, helloWorldTrackStates } from '../audio/tracks'
import { newId } from '../utils/id'
import { debounce, loadPersisted, savePersisted } from '../composables/usePersistence'

function makePattern(name: string, opts?: { hello?: boolean }): Pattern {
  const now = Date.now()
  return {
    id: newId(),
    name,
    bpm: 120,
    swing: 0,
    tracks: opts?.hello ? helloWorldTrackStates() : defaultTrackStates(),
    createdAt: now,
    updatedAt: now,
  }
}

export const useSequencerStore = defineStore('sequencer', () => {
  const patterns = ref<Pattern[]>([])
  const currentPatternId = ref<string | null>(null)

  const isPlaying = ref(false)
  const playheadStep = ref(0)
  const audioReady = ref(false)

  const currentPattern = computed<Pattern>(() => {
    const found = patterns.value.find((p) => p.id === currentPatternId.value)
    if (found) return found
    // safety net — should never hit because boot creates one
    if (patterns.value.length > 0) {
      currentPatternId.value = patterns.value[0]!.id
      return patterns.value[0]!
    }
    const fresh = makePattern('Untitled', { hello: true })
    patterns.value.push(fresh)
    currentPatternId.value = fresh.id
    return fresh
  })

  function touch() {
    currentPattern.value.updatedAt = Date.now()
  }

  function toggleStep(trackId: TrackId, stepIndex: number) {
    const t = currentPattern.value.tracks.find((x) => x.id === trackId)
    if (!t) return
    t.steps[stepIndex] = !t.steps[stepIndex]
    touch()
  }

  function setBpm(bpm: number) {
    currentPattern.value.bpm = Math.max(60, Math.min(200, Math.round(bpm)))
    touch()
  }

  function setSwing(amount: number) {
    currentPattern.value.swing = Math.max(0, Math.min(0.5, amount))
    touch()
  }

  function setTrackVolume(trackId: TrackId, dB: number) {
    const t = currentPattern.value.tracks.find((x) => x.id === trackId)
    if (!t) return
    t.volume = Math.max(-40, Math.min(0, dB))
    touch()
  }

  function setTrackPitch(trackId: TrackId, semis: number) {
    const t = currentPattern.value.tracks.find((x) => x.id === trackId)
    if (!t) return
    t.pitch = Math.max(-12, Math.min(12, Math.round(semis)))
    touch()
  }

  function toggleMute(trackId: TrackId) {
    const t = currentPattern.value.tracks.find((x) => x.id === trackId)
    if (!t) return
    t.muted = !t.muted
    touch()
  }

  function toggleSolo(trackId: TrackId) {
    const t = currentPattern.value.tracks.find((x) => x.id === trackId)
    if (!t) return
    t.solo = !t.solo
    touch()
  }

  function clearTrack(trackId: TrackId) {
    const t = currentPattern.value.tracks.find((x) => x.id === trackId)
    if (!t) return
    t.steps = t.steps.map(() => false)
    touch()
  }

  function clearPattern() {
    currentPattern.value.tracks.forEach((t) => {
      t.steps = t.steps.map(() => false)
    })
    touch()
  }

  function setPlaying(v: boolean) {
    isPlaying.value = v
  }

  function setPlayheadStep(i: number) {
    playheadStep.value = i
  }

  function setAudioReady(v: boolean) {
    audioReady.value = v
  }

  // Pattern management
  function newPattern(name?: string) {
    const p = makePattern(name ?? 'Untitled')
    patterns.value.push(p)
    currentPatternId.value = p.id
  }

  function loadPattern(id: string) {
    if (patterns.value.some((p) => p.id === id)) {
      currentPatternId.value = id
      playheadStep.value = 0
    }
  }

  function savePatternAs(name: string) {
    // rename current pattern (it's already in the list); this is the "Save" action
    const cur = currentPattern.value
    cur.name = name.trim() || 'Untitled'
    cur.updatedAt = Date.now()
  }

  function renamePattern(id: string, name: string) {
    const p = patterns.value.find((x) => x.id === id)
    if (!p) return
    p.name = name.trim() || 'Untitled'
    p.updatedAt = Date.now()
  }

  function duplicatePattern(id: string) {
    const src = patterns.value.find((x) => x.id === id)
    if (!src) return
    const copy: Pattern = {
      ...JSON.parse(JSON.stringify(src)),
      id: newId(),
      name: `${src.name} copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    patterns.value.push(copy)
    currentPatternId.value = copy.id
  }

  function deletePattern(id: string) {
    const idx = patterns.value.findIndex((x) => x.id === id)
    if (idx < 0) return
    patterns.value.splice(idx, 1)
    if (currentPatternId.value === id) {
      if (patterns.value.length === 0) {
        const fresh = makePattern('Untitled', { hello: true })
        patterns.value.push(fresh)
        currentPatternId.value = fresh.id
      } else {
        currentPatternId.value = patterns.value[0]!.id
      }
    }
  }

  // Boot — hydrate or create defaults
  function init() {
    const persisted = loadPersisted()
    if (persisted && persisted.patterns.length > 0) {
      patterns.value = persisted.patterns
      currentPatternId.value =
        persisted.currentPatternId && persisted.patterns.some((p) => p.id === persisted.currentPatternId)
          ? persisted.currentPatternId
          : persisted.patterns[0]!.id
    } else {
      const fresh = makePattern('Untitled', { hello: true })
      patterns.value = [fresh]
      currentPatternId.value = fresh.id
    }

    const persistDebounced = debounce(() => {
      const snapshot: PersistedState = {
        version: 1,
        currentPatternId: currentPatternId.value,
        patterns: JSON.parse(JSON.stringify(patterns.value)) as Pattern[],
      }
      savePersisted(snapshot)
    }, 300)

    watch([patterns, currentPatternId], persistDebounced, { deep: true })
  }

  return {
    patterns,
    currentPatternId,
    currentPattern,
    isPlaying,
    playheadStep,
    audioReady,
    init,
    toggleStep,
    setBpm,
    setSwing,
    setTrackVolume,
    setTrackPitch,
    toggleMute,
    toggleSolo,
    clearTrack,
    clearPattern,
    setPlaying,
    setPlayheadStep,
    setAudioReady,
    newPattern,
    loadPattern,
    savePatternAs,
    renamePattern,
    duplicatePattern,
    deletePattern,
  }
})
