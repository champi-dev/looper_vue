# StepLab — Browser Step Sequencer

> **Build agent instructions:** This document is the single source of truth for the build. Implement it end-to-end without asking for clarification. When in doubt, prefer the simplest implementation that satisfies the spec, and ship a polished, working demo over an incomplete but ambitious one. All UI copy is in English unless otherwise noted.

---

## 1. Product Summary

**StepLab** is a browser-based 16-step sequencer inspired by classic drum machines (TR-808, MPC) and modern DAWs (Ableton, FL Studio). Users build looping patterns by toggling steps across multiple tracks (drums + synths), tweak per-track parameters, save/load their patterns, and watch reactive visualizations pulse with the audio.

The app is **single-page, client-only**, with persistence via `localStorage`. No backend, no auth, no accounts.

### Core user flow
1. User lands on the sequencer view with a default empty pattern at 120 BPM.
2. They click steps in the grid to activate notes on each track.
3. They press Play — the sequencer loops the pattern, lights up the playhead, and audio plays in sync.
4. They tweak BPM, swing, per-track volume/pitch, and watch the visualizer react.
5. They save the pattern with a name; they can load any saved pattern from a sidebar.

### Non-goals
- No MIDI export, no WAV export, no audio file upload.
- No multi-bar patterns (single 16-step loop only).
- No mobile-first design (must work on mobile but desktop is primary).
- No user accounts, no cloud sync.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Vue 3** with `<script setup>` Composition API | TypeScript |
| Build tool | **Vite** | latest stable |
| State | **Pinia** | one store: `useSequencerStore` |
| Audio | **Tone.js** (latest) | handles transport, sampling, synthesis, scheduling |
| Styling | **Tailwind CSS** | dark theme by default |
| Icons | **lucide-vue-next** | |
| Persistence | `localStorage` | namespaced key: `steplab:*` |
| Visualization | **Canvas 2D API** | direct, no extra lib |
| Lang | TypeScript everywhere | strict mode on |
| Linting | ESLint + Prettier | sensible defaults |

**No** Vuex, no Vue Router (single view), no UI component libraries (build raw with Tailwind).

---

## 3. Project Structure

```
steplab/
├── public/
│   └── samples/                    # see §4 for sample list
│       ├── kick.wav
│       ├── snare.wav
│       ├── hihat-closed.wav
│       ├── hihat-open.wav
│       ├── clap.wav
│       ├── tom.wav
│       └── perc.wav
├── src/
│   ├── App.vue                     # root layout
│   ├── main.ts
│   ├── style.css                   # tailwind directives + custom vars
│   ├── components/
│   │   ├── TopBar.vue              # logo, BPM, swing, play/stop, save
│   │   ├── TrackRow.vue            # one row of the grid (label + 16 steps + controls)
│   │   ├── StepCell.vue            # single step button
│   │   ├── TrackControls.vue       # mute, solo, volume, pitch per track
│   │   ├── PatternSidebar.vue      # saved patterns list + save dialog
│   │   ├── Visualizer.vue          # canvas-based audio reactive visual
│   │   └── HelpModal.vue           # keyboard shortcuts + about
│   ├── stores/
│   │   └── sequencer.ts            # Pinia store
│   ├── audio/
│   │   ├── engine.ts               # Tone.js setup, transport, scheduling
│   │   ├── tracks.ts               # track definitions (samples + synths)
│   │   └── analyser.ts             # AnalyserNode wrapper for visualizer
│   ├── composables/
│   │   ├── useKeyboardShortcuts.ts
│   │   └── usePersistence.ts
│   ├── types.ts                    # shared types
│   └── utils/
│       └── id.ts                   # nanoid wrapper
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 4. Tracks & Sounds

The sequencer has **8 tracks**, each with a fixed sound source. Five are sample-based drums; three are Tone.js-generated synths. This gives a complete starter kit without needing dozens of samples.

| # | Track Name | Type | Source | Default Volume (dB) |
|---|---|---|---|---|
| 1 | Kick | Sample | `/samples/kick.wav` | -6 |
| 2 | Snare | Sample | `/samples/snare.wav` | -8 |
| 3 | Hi-Hat | Sample | `/samples/hihat-closed.wav` | -12 |
| 4 | Open Hat | Sample | `/samples/hihat-open.wav` | -14 |
| 5 | Clap | Sample | `/samples/clap.wav` | -10 |
| 6 | Bass | Synth (`Tone.MonoSynth`) | C2, square wave, short envelope | -8 |
| 7 | Lead | Synth (`Tone.Synth`) | C4, triangle, plucky envelope | -12 |
| 8 | Pad | Synth (`Tone.PolySynth` w/ `AMSynth`) | C3 chord (C-E-G), slow attack | -16 |

### Sample sourcing
The build agent must include royalty-free WAV samples in `public/samples/`. Use samples from the **Freesound CC0 collection** or generate them programmatically with Tone.js offline rendering at build time (preferred — no copyright headache). If generating: render each drum sound from `Tone.MembraneSynth` (kick), `Tone.NoiseSynth` (snare/hat/clap), and a short `Tone.MetalSynth` (perc/tom) to WAV files placed in `public/samples/`. Provide a `scripts/generate-samples.ts` that does this and runs once via `npm run gen-samples`.

### Synth voices (exact Tone.js configs)

```ts
// Bass
new Tone.MonoSynth({
  oscillator: { type: 'square' },
  envelope: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.1 },
  filterEnvelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.2, baseFrequency: 200, octaves: 2.5 }
})

// Lead
new Tone.Synth({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.002, decay: 0.1, sustain: 0.0, release: 0.2 }
})

// Pad
new Tone.PolySynth(Tone.AMSynth, {
  harmonicity: 1.5,
  oscillator: { type: 'sine' },
  envelope: { attack: 0.4, decay: 0.3, sustain: 0.6, release: 1.2 },
  modulation: { type: 'square' },
  modulationEnvelope: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 0.5 }
})
```

For synth tracks, when a step is active, trigger:
- Bass: `triggerAttackRelease('C2', '16n')`
- Lead: `triggerAttackRelease('C4', '16n')`
- Pad: `triggerAttackRelease(['C3', 'E3', 'G3'], '8n')`

---

## 5. Data Model

```ts
// src/types.ts

export type TrackId = 'kick' | 'snare' | 'hihat' | 'openhat' | 'clap' | 'bass' | 'lead' | 'pad'
export type TrackKind = 'sample' | 'synth'

export interface TrackDefinition {
  id: TrackId
  name: string
  kind: TrackKind
  color: string             // hex, used for grid + visualizer
  defaultVolume: number     // dB
}

export interface TrackState {
  id: TrackId
  steps: boolean[]          // length 16
  volume: number            // dB, range -40..0
  pitch: number             // semitones, range -12..+12 (only meaningful for synths + sample playback rate)
  muted: boolean
  solo: boolean
}

export interface Pattern {
  id: string                // nanoid
  name: string
  bpm: number               // 60..200
  swing: number             // 0..0.5
  tracks: TrackState[]      // length 8, in track-definition order
  createdAt: number
  updatedAt: number
}

export interface PersistedState {
  version: 1
  currentPatternId: string | null
  patterns: Pattern[]
}
```

The store always keeps a `currentPattern` ref. Edits mutate `currentPattern` directly; saving persists to the patterns list.

---

## 6. Audio Engine

### Setup (`src/audio/engine.ts`)

Single module exporting an `AudioEngine` class (instantiated once, lazy on first user gesture per browser autoplay policy).

```ts
class AudioEngine {
  private players: Map<TrackId, Tone.Player>          // for samples
  private synths: Map<TrackId, Tone.Synth | Tone.MonoSynth | Tone.PolySynth>
  private channels: Map<TrackId, Tone.Channel>        // per-track volume + mute
  private masterAnalyser: Tone.Analyser               // for visualizer

  async init(): Promise<void>                         // calls Tone.start(), loads samples
  setBpm(bpm: number): void
  setSwing(amount: number): void                      // Tone.Transport.swing
  setTrackVolume(id: TrackId, dB: number): void
  setTrackPitch(id: TrackId, semitones: number): void
  setTrackMuted(id: TrackId, muted: boolean): void
  setSolo(soloIds: TrackId[]): void                   // mutes all not in list
  schedulePattern(pattern: Pattern, onStep: (stepIndex: number) => void): void
  start(): void
  stop(): void
  getAnalyser(): Tone.Analyser
}
```

### Scheduling
Use `Tone.Sequence` with a 16-step array `[0..15]` and subdivision `'16n'`. On each callback:
1. Read the current `pattern` from the store (via callback closure or a ref the engine subscribes to).
2. For each track, if `track.steps[stepIndex]` is true and the track is not muted (and respecting solo), trigger its sound.
3. Call the `onStep` callback for the UI to highlight the playhead.

The store and engine must stay in sync via a single subscription: when steps/volume/pitch/mute/solo change, the engine reads the latest values on the next step callback. Don't recreate the sequence on every edit — only on BPM/swing change or play/stop.

### Pitch on samples
Implement pitch shift on samples with `Tone.Player.playbackRate`, where rate = `2 ** (semitones / 12)`. Acceptable artifact: tempo of the sample changes with pitch (this is the classic drum-machine behavior — keep it, don't try to time-stretch).

---

## 7. UI / Layout

### Overall layout (desktop, ≥1024px)
```
┌─────────────────────────────────────────────────────────────┐
│  TopBar: [logo] [BPM ◀▶] [Swing slider] [▶/■] [Save] [?]  │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  Sidebar    │   Track Grid                                  │
│  (patterns) │   ┌──────────────────────────────────┐        │
│             │   │ Kick    | □ □ ■ □ □ □ ■ □ ...    │        │
│  + New      │   │ Snare   | □ □ □ □ ■ □ □ □ ...    │        │
│  Pattern A  │   │ ...                              │        │
│  Pattern B  │   └──────────────────────────────────┘        │
│             │                                               │
│             │   Visualizer (full-width, ~120px tall)        │
│             │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

On screens <1024px wide: sidebar collapses to a button that opens a drawer.

### TopBar (`TopBar.vue`)
- **Logo / wordmark**: "StepLab" in a slightly playful display font (use `Space Grotesk` from Google Fonts).
- **BPM control**: numeric input + up/down arrows, range 60–200, default 120.
- **Swing slider**: 0%–50%, default 0%. Wire to `Tone.Transport.swing`.
- **Play/Stop button**: large, primary color when playing. Spacebar shortcut.
- **Save button**: opens save dialog (name input → confirm).
- **Help button** (`?`): opens HelpModal.

### Track grid
- Each track is one row.
- Row layout: `[track label + controls (180px)] | [16 step cells]`.
- Step cells are square, ~36px on desktop, with a subtle border. Inactive = dim, active = filled with the track's color. Currently-playing step has a bright outline + slight scale animation.
- Steps grouped visually in 4 groups of 4 (small gap between groups → makes counting beats easier).

### Track controls (left of each row)
- Track name (bold).
- Mute button (M) and Solo button (S): small toggle buttons.
- Volume knob: vertical slider, -40 to 0 dB. Show dB value on hover.
- Pitch knob: rotary-looking control (CSS rotation), -12 to +12 semitones. Double-click to reset to 0.

### Pattern sidebar
- "+ New Pattern" button at top.
- List of saved patterns, each row shows name + BPM + a small dot in the active track color.
- Click to load. Right-click (or kebab menu) for rename / duplicate / delete.
- Currently-loaded pattern is highlighted.

### Visualizer (`Visualizer.vue`)
- Canvas, full container width, ~120px tall.
- Pulls FFT data from `engine.getAnalyser().getValue()` at ~60fps via `requestAnimationFrame`.
- **Visual style**: 64-band bar spectrum, but stylized — bars rendered as vertical gradients matching each track's color (rotate hues across the spectrum). Bars have smooth decay (low-pass smoothing on values).
- Add a thin horizontal "playhead pulse" line that flashes white briefly on each step the playhead lands on, to tie audio + visual.
- When stopped: show idle animation (gentle sine-wave shimmer at low amplitude).

### Empty state
When no pattern exists, auto-create one named "Untitled" so the user is never staring at an empty grid.

---

## 8. Visual Design

### Color palette (dark theme, only theme)
```css
--bg-base: #0a0a0f;
--bg-panel: #14141c;
--bg-elevated: #1c1c28;
--border: #2a2a3a;
--text-primary: #f4f4f8;
--text-secondary: #9090a8;
--text-dim: #5a5a70;
--accent: #ff5b3a;       /* primary accent — play button, active states */
```

### Per-track colors (used on active steps + visualizer bars)
```
Kick:    #ff5b3a   (accent orange)
Snare:   #ffb73a   (amber)
Hi-Hat:  #ffe83a   (yellow)
Open Hat:#a3ff3a   (lime)
Clap:    #3affc8   (cyan)
Bass:    #3a8aff   (blue)
Lead:    #b13aff   (purple)
Pad:     #ff3a9b   (pink)
```

### Typography
- Display (logo, big numbers): `Space Grotesk`
- UI: `Inter`
- Both via Google Fonts. Self-host via `@fontsource` packages so there's no FOUC.

### Motion
- Step toggle: 80ms ease-out scale + color.
- Playhead step highlight: 100ms.
- Modal/drawer: 200ms ease-out.
- Avoid bouncy springs. Keep it snappy and "instrument-like."

### Polish details
- Subtle grain/noise texture on `--bg-base` (CSS, ~3% opacity).
- Step group dividers: thin vertical lines every 4 steps inside the grid.
- Beat 1 gets a tiny "1" label above the column.
- All interactive elements have visible focus rings (accessibility).

---

## 9. State Management (Pinia)

```ts
// src/stores/sequencer.ts

export const useSequencerStore = defineStore('sequencer', () => {
  // Persisted
  const patterns = ref<Pattern[]>([])
  const currentPatternId = ref<string | null>(null)

  // Derived
  const currentPattern = computed<Pattern>(...)

  // Transient (not persisted)
  const isPlaying = ref(false)
  const playheadStep = ref(0)            // 0..15
  const audioReady = ref(false)

  // Actions
  function toggleStep(trackId: TrackId, stepIndex: number): void
  function setBpm(bpm: number): void
  function setSwing(amount: number): void
  function setTrackVolume(trackId: TrackId, dB: number): void
  function setTrackPitch(trackId: TrackId, semis: number): void
  function toggleMute(trackId: TrackId): void
  function toggleSolo(trackId: TrackId): void
  function clearTrack(trackId: TrackId): void
  function clearPattern(): void
  function play(): Promise<void>
  function stop(): void

  // Pattern management
  function newPattern(name?: string): void
  function loadPattern(id: string): void
  function savePatternAs(name: string): void
  function renamePattern(id: string, name: string): void
  function duplicatePattern(id: string): void
  function deletePattern(id: string): void

  return { /* state + actions */ }
})
```

Auto-persist: a watcher on `[patterns, currentPatternId]` writes to `localStorage` (debounced 300ms).

On app boot: read from `localStorage`, hydrate, run a migration check on `version`. If invalid, reset cleanly with a console warning.

---

## 10. Keyboard Shortcuts

| Key | Action |
|---|---|
| Space | Play / Stop |
| 1–8 | Toggle mute on track 1–8 |
| Shift + 1–8 | Toggle solo on track 1–8 |
| C | Clear current pattern (with confirm) |
| ⌘/Ctrl + S | Save pattern (opens dialog if unnamed) |
| ⌘/Ctrl + N | New pattern |
| ? | Open help modal |

Implement via `useKeyboardShortcuts` composable. Don't fire when focus is in an input.

---

## 11. Defaults: a "Hello World" pattern

When the user clicks "New Pattern" for the first time (or on first app load), pre-populate with a simple house beat so they have something to hear immediately:

```
Kick:    ■ . . . ■ . . . ■ . . . ■ . . .
Snare:   . . . . ■ . . . . . . . ■ . . .
Hi-Hat:  ■ . ■ . ■ . ■ . ■ . ■ . ■ . ■ .
Bass:    ■ . . . . . ■ . ■ . . . . . ■ .
```

Other tracks empty. BPM 120, swing 0.

---

## 12. Acceptance Criteria

The build is done when **all** of these are true:

1. `npm install && npm run gen-samples && npm run dev` boots the app on `localhost:5173` with zero console errors or warnings.
2. The user lands on a sequencer with a pre-populated 4-track house beat.
3. Pressing Space starts playback; the playhead lights each step in time; audio is audible and on-beat.
4. Toggling any step on any of the 8 tracks immediately changes what plays on the next loop.
5. BPM and swing changes take effect within one loop cycle without audio glitches.
6. Per-track volume, pitch, mute, and solo all work as specified.
7. Saving a pattern, refreshing the page, and reloading it restores the exact same state (steps, BPM, swing, per-track params).
8. The visualizer reacts to audio when playing and idles when stopped.
9. All keyboard shortcuts work.
10. The app is responsive: usable at 768px width (sidebar in drawer); functional at 380px (steps may scroll horizontally).
11. No external network requests at runtime besides Google Fonts (which are self-hosted via @fontsource — so really, zero).
12. Lighthouse performance score ≥ 90 on a production build.

---

## 13. README requirements

The generated `README.md` must include:
- One-paragraph description.
- Screenshot placeholder (`./screenshot.png`).
- Quickstart: `npm install`, `npm run gen-samples`, `npm run dev`.
- Stack list.
- Keyboard shortcuts table.
- Credits / license note (MIT, samples generated programmatically — no third-party attribution needed).

---

## 14. Out of scope (do not build)

- WAV/MP3 export
- MIDI in/out
- Multi-pattern song mode / chaining
- Effects (reverb/delay/filter) — explicitly excluded by user
- Pattern sharing via URL — explicitly excluded by user
- Sample upload
- Undo/redo
- Themes (dark only)

If time permits after acceptance criteria pass, polish the visualizer and animations rather than adding features outside this list.