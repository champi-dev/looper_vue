# StepLab

> A browser drum machine. Click squares, hear beats. Open a tab — done.
> **Vue 3 · TypeScript · Tone.js · Tailwind.**

![StepLab screenshot](./screenshot.png)

---

## What is it?

A pocket-sized music studio that lives in your browser. You build a 1-bar loop on a grid of 16 squares × 8 instruments (drums + synths), press play, and tweak it live. Save patterns, switch between them, watch the visualizer pulse.

No installs. No accounts. No backend.

---

## Highlights

- **8 instruments × 16 steps** — kick, snare, hi-hats, clap, bass, lead, pad
- **Per-track controls** — mute, solo, volume, pitch
- **Tempo & swing** — 60–200 BPM, 0–50% swing
- **Save / load** — patterns live in your browser, survive refresh
- **Reactive visualizer** — colored spectrum that pulses with the beat
- **Keyboard-friendly** — Space to play, 1–8 to mute, ? for help
- **Drum samples synthesized from scratch** — zero third-party audio
- **~1.5k lines of code, 100 KB gzipped**

---

## How it's wired

```
   ┌──────────────────────────────────────────────────────┐
   │                       Browser tab                    │
   │                                                      │
   │   ┌──────────┐  click   ┌──────────┐   reads   ┌───┐ │
   │   │  Vue UI  │ ───────▶ │  Pinia   │ ────────▶ │ T │ │
   │   │  (grid)  │ ◀─────── │  store   │ ◀──────── │ o │ │
   │   └──────────┘  render  └──────────┘  playhead │ n │ │
   │                            │  ▲                │ e │ │
   │                            ▼  │ hydrate        │ . │ │
   │                       ┌─────────────┐          │ j │ │
   │                       │localStorage │          │ s │ │
   │                       └─────────────┘          └───┘ │
   │                                                  │   │
   │                                                  ▼   │
   │                                           ◀))) audio │
   └──────────────────────────────────────────────────────┘
```

**One sentence:** the Pinia store is the single source of truth — the UI reads from it, and Tone.js plays from it.

---

## What happens when you press Play

```
  Tone.Transport ticks every 16th note
         │
         ▼
  for step 0..15 (looping):
         │
         ├─▶ for each track, is this step ON?
         │       │
         │       ├─▶ sample track? → trigger Tone.Player
         │       └─▶ synth track?  → trigger Tone.Synth
         │
         └─▶ light up the playhead in the UI
```

Sequenced via `Tone.Sequence` with sample-accurate scheduling — no `setTimeout`, no drift. The UI playhead is synced to the audio via `Tone.getDraw()`.

---

## Drum samples, made from math

No royalty samples, no big audio files in the repo. A small Node script (`scripts/generate-samples.mjs`) synthesizes each drum from raw DSP and writes a `.wav`:

| Drum | Recipe |
|---|---|
| **Kick** | Sine sweep 110 → 45 Hz + click |
| **Snare** | Two tones + white noise, high-passed |
| **Hi-Hat** | White noise burst, fast decay |
| **Clap** | Three quick noise bursts + tail |

Run `npm run gen-samples` once and you have a complete drum kit.

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | **Vue 3** (Composition API, TypeScript) |
| Build | **Vite** |
| State | **Pinia** |
| Audio | **Tone.js** (Web Audio API wrapper) |
| Styling | **Tailwind CSS**, dark theme |
| Persistence | **localStorage** (debounced, versioned schema) |
| Visualizer | **Canvas 2D** (64-band FFT) |

---

## Keyboard

| Key | Action |
|---|---|
| `Space` | Play / Stop |
| `1`–`8` | Mute track |
| `Shift`+`1`–`8` | Solo track |
| `Ctrl`+`S` / `Ctrl`+`N` | Save / New pattern |
| `?` | Help |

---

## Run it

```bash
npm install
npm run gen-samples   # synthesize drum WAVs
npm run dev           # http://localhost:5173
```

---

## On purpose, not in scope

No MIDI export, no song mode, no effects, no sample upload, no cloud sync.
**One polished loop, well done.**

---

MIT licensed. Drums synthesized from scratch — no attribution required.
