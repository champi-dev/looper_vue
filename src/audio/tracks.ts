import type { TrackDefinition, TrackId, TrackState } from '../types'
import { STEPS_PER_BAR } from '../types'

export const TRACK_DEFINITIONS: TrackDefinition[] = [
  { id: 'kick', name: 'Kick', kind: 'sample', color: '#ff5b3a', defaultVolume: -6, samplePath: '/samples/kick.wav' },
  { id: 'snare', name: 'Snare', kind: 'sample', color: '#ffb73a', defaultVolume: -8, samplePath: '/samples/snare.wav' },
  { id: 'hihat', name: 'Hi-Hat', kind: 'sample', color: '#ffe83a', defaultVolume: -12, samplePath: '/samples/hihat-closed.wav' },
  { id: 'openhat', name: 'Open Hat', kind: 'sample', color: '#a3ff3a', defaultVolume: -14, samplePath: '/samples/hihat-open.wav' },
  { id: 'clap', name: 'Clap', kind: 'sample', color: '#3affc8', defaultVolume: -10, samplePath: '/samples/clap.wav' },
  { id: 'bass', name: 'Bass', kind: 'synth', color: '#3a8aff', defaultVolume: -8 },
  { id: 'lead', name: 'Lead', kind: 'synth', color: '#b13aff', defaultVolume: -12 },
  { id: 'pad', name: 'Pad', kind: 'synth', color: '#ff3a9b', defaultVolume: -16 },
]

export function getTrackDefinition(id: TrackId): TrackDefinition {
  const def = TRACK_DEFINITIONS.find((d) => d.id === id)
  if (!def) throw new Error(`Unknown track: ${id}`)
  return def
}

export function emptySteps(): boolean[] {
  return Array.from({ length: STEPS_PER_BAR }, () => false)
}

export function defaultTrackStates(): TrackState[] {
  return TRACK_DEFINITIONS.map((def) => ({
    id: def.id,
    steps: emptySteps(),
    volume: def.defaultVolume,
    pitch: 0,
    muted: false,
    solo: false,
  }))
}

// "Hello World" house beat from spec §11
export function helloWorldTrackStates(): TrackState[] {
  const tracks = defaultTrackStates()
  const set = (id: TrackId, indices: number[]) => {
    const t = tracks.find((x) => x.id === id)!
    indices.forEach((i) => (t.steps[i] = true))
  }
  set('kick', [0, 4, 8, 12])
  set('snare', [4, 12])
  set('hihat', [0, 2, 4, 6, 8, 10, 12, 14])
  set('bass', [0, 6, 8, 14])
  return tracks
}
