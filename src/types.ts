export type TrackId =
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'openhat'
  | 'clap'
  | 'bass'
  | 'lead'
  | 'pad'

export type TrackKind = 'sample' | 'synth'

export interface TrackDefinition {
  id: TrackId
  name: string
  kind: TrackKind
  color: string
  defaultVolume: number
  samplePath?: string
}

export interface TrackState {
  id: TrackId
  steps: boolean[]
  volume: number
  pitch: number
  muted: boolean
  solo: boolean
}

export interface Pattern {
  id: string
  name: string
  bpm: number
  swing: number
  tracks: TrackState[]
  createdAt: number
  updatedAt: number
}

export interface PersistedState {
  version: 1
  currentPatternId: string | null
  patterns: Pattern[]
}

export const STORAGE_KEY = 'steplab:state'
export const STEPS_PER_BAR = 16
