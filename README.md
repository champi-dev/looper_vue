# StepLab — Browser Step Sequencer

A browser-based 16-step sequencer inspired by classic drum machines (TR-808, MPC) and modern DAWs (Ableton, FL Studio). Build looping patterns across 8 tracks (5 sample-based drums + 3 synths), tweak per-track parameters, and watch the visualizer pulse with the audio. Single-page, client-only, persistence via `localStorage`.

![StepLab screenshot](./screenshot.png)

## Quickstart

```bash
npm install
npm run gen-samples   # generates drum WAVs into public/samples/
npm run dev           # http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

## Stack

- **Vue 3** + `<script setup>` (TypeScript, strict mode)
- **Vite** — build tool
- **Pinia** — state management
- **Tone.js** — audio engine, scheduling, synthesis
- **Tailwind CSS** — styling (dark theme only)
- **lucide-vue-next** — icons
- **`@fontsource`** — self-hosted Inter + Space Grotesk
- **Canvas 2D API** — visualizer

## Keyboard shortcuts

| Key | Action |
|---|---|
| Space | Play / Stop |
| 1 – 8 | Toggle mute on track 1–8 |
| Shift + 1 – 8 | Toggle solo on track 1–8 |
| C | Clear current pattern (with confirm) |
| Ctrl/⌘ + S | Save pattern |
| Ctrl/⌘ + N | New pattern |
| ? | Open help modal |

## Tracks

| # | Track | Type |
|---|---|---|
| 1 | Kick | Sample |
| 2 | Snare | Sample |
| 3 | Hi-Hat | Sample |
| 4 | Open Hat | Sample |
| 5 | Clap | Sample |
| 6 | Bass | `Tone.MonoSynth` (square, C2) |
| 7 | Lead | `Tone.Synth` (triangle, C4) |
| 8 | Pad | `Tone.PolySynth(AMSynth)` (C-E-G chord, C3) |

Per-track controls: mute, solo, volume (-40..0 dB), pitch (-12..+12 semitones, samples use playback-rate shift).

## Notes

- **Samples** are generated programmatically at install time via `scripts/generate-samples.mjs` (pure DSP, no third-party audio).
- **Audio context** starts on first user gesture (browser autoplay policy).
- All state persists in `localStorage` under the `steplab:state` key.

## Credits / License

MIT. Drum samples are generated from scratch — no third-party attribution required.
