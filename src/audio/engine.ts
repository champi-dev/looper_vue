import * as Tone from 'tone'
import type { Pattern, TrackId } from '../types'
import { TRACK_DEFINITIONS } from './tracks'

type AnyVoice = Tone.Synth | Tone.MonoSynth | Tone.PolySynth

export class AudioEngine {
  private players = new Map<TrackId, Tone.Player>()
  private synths = new Map<TrackId, AnyVoice>()
  private channels = new Map<TrackId, Tone.Channel>()
  private analyser!: Tone.Analyser
  private sequence: Tone.Sequence<number> | null = null
  private patternRef: Pattern | null = null
  private onStep: ((stepIndex: number) => void) | null = null
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return
    await Tone.start()

    this.analyser = new Tone.Analyser('fft', 128)
    Tone.getDestination().connect(this.analyser)

    // Build channels per track
    for (const def of TRACK_DEFINITIONS) {
      const ch = new Tone.Channel({ volume: def.defaultVolume }).toDestination()
      this.channels.set(def.id, ch)
    }

    // Sample players
    const sampleDefs = TRACK_DEFINITIONS.filter((d) => d.kind === 'sample' && d.samplePath)
    await Promise.all(
      sampleDefs.map(async (def) => {
        const player = new Tone.Player({ url: def.samplePath!, autostart: false })
        player.connect(this.channels.get(def.id)!)
        this.players.set(def.id, player)
        await Tone.loaded() // wait for buffer
      }),
    )
    // make sure all buffers loaded
    await Tone.loaded()

    // Synths
    const bass = new Tone.MonoSynth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.1 },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 0.2,
        baseFrequency: 200,
        octaves: 2.5,
      },
    })
    bass.connect(this.channels.get('bass')!)
    this.synths.set('bass', bass)

    const lead = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.002, decay: 0.1, sustain: 0.0, release: 0.2 },
    })
    lead.connect(this.channels.get('lead')!)
    this.synths.set('lead', lead)

    const pad = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 1.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.4, decay: 0.3, sustain: 0.6, release: 1.2 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 0.5 },
    })
    pad.connect(this.channels.get('pad')!)
    this.synths.set('pad', pad)

    this.initialized = true
  }

  isReady(): boolean {
    return this.initialized
  }

  setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = bpm
  }

  setSwing(amount: number): void {
    Tone.getTransport().swing = amount
    Tone.getTransport().swingSubdivision = '16n'
  }

  setTrackVolume(id: TrackId, dB: number): void {
    const ch = this.channels.get(id)
    if (ch) ch.volume.value = dB
  }

  setTrackPitch(id: TrackId, semitones: number): void {
    const player = this.players.get(id)
    if (player) {
      player.playbackRate = Math.pow(2, semitones / 12)
    }
    // synths use semitone offset at trigger time (read from patternRef)
  }

  setTrackMuted(id: TrackId, muted: boolean): void {
    const ch = this.channels.get(id)
    if (ch) ch.mute = muted
  }

  applyMuteSolo(soloIds: TrackId[]): void {
    const anySolo = soloIds.length > 0
    for (const def of TRACK_DEFINITIONS) {
      const ch = this.channels.get(def.id)!
      const trackMuted = this.patternRef?.tracks.find((t) => t.id === def.id)?.muted ?? false
      if (anySolo) {
        ch.mute = !soloIds.includes(def.id) || trackMuted
      } else {
        ch.mute = trackMuted
      }
    }
  }

  setPattern(pattern: Pattern): void {
    this.patternRef = pattern
    // sync engine state to pattern
    this.setBpm(pattern.bpm)
    this.setSwing(pattern.swing)
    for (const t of pattern.tracks) {
      this.setTrackVolume(t.id, t.volume)
      this.setTrackPitch(t.id, t.pitch)
    }
    const soloIds = pattern.tracks.filter((t) => t.solo).map((t) => t.id)
    this.applyMuteSolo(soloIds)
  }

  scheduleSequence(onStep: (stepIndex: number) => void): void {
    if (this.sequence) {
      this.sequence.dispose()
      this.sequence = null
    }
    this.onStep = onStep
    const indices = Array.from({ length: 16 }, (_, i) => i)
    this.sequence = new Tone.Sequence<number>(
      (time, stepIndex) => {
        this.triggerStep(stepIndex, time)
        if (this.onStep) {
          Tone.getDraw().schedule(() => this.onStep!(stepIndex), time)
        }
      },
      indices,
      '16n',
    )
    this.sequence.start(0)
  }

  private triggerStep(stepIndex: number, time: number): void {
    const pattern = this.patternRef
    if (!pattern) return
    const soloIds = pattern.tracks.filter((t) => t.solo).map((t) => t.id)
    const anySolo = soloIds.length > 0

    for (const t of pattern.tracks) {
      if (!t.steps[stepIndex]) continue
      if (t.muted) continue
      if (anySolo && !soloIds.includes(t.id)) continue

      const def = TRACK_DEFINITIONS.find((d) => d.id === t.id)!
      if (def.kind === 'sample') {
        const player = this.players.get(t.id)
        if (player && player.loaded) {
          // re-apply playbackRate in case pitch changed
          player.playbackRate = Math.pow(2, t.pitch / 12)
          player.start(time)
        }
      } else {
        const synth = this.synths.get(t.id)
        if (!synth) continue
        if (t.id === 'bass') {
          ;(synth as Tone.MonoSynth).triggerAttackRelease(
            shiftNote('C2', t.pitch),
            '16n',
            time,
          )
        } else if (t.id === 'lead') {
          ;(synth as Tone.Synth).triggerAttackRelease(
            shiftNote('C4', t.pitch),
            '16n',
            time,
          )
        } else if (t.id === 'pad') {
          const chord = ['C3', 'E3', 'G3'].map((n) => shiftNote(n, t.pitch))
          ;(synth as Tone.PolySynth).triggerAttackRelease(chord, '8n', time)
        }
      }
    }
  }

  start(): void {
    Tone.getTransport().start()
  }

  stop(): void {
    Tone.getTransport().stop()
    Tone.getTransport().position = 0
  }

  getAnalyser(): Tone.Analyser {
    return this.analyser
  }
}

function shiftNote(note: string, semitones: number): string {
  if (semitones === 0) return note
  const freq = Tone.Frequency(note).transpose(semitones)
  return freq.toNote()
}

let engineInstance: AudioEngine | null = null
export function getEngine(): AudioEngine {
  if (!engineInstance) engineInstance = new AudioEngine()
  return engineInstance
}
