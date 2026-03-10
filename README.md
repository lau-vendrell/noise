# Noise

An interactive particle field built with Canvas, where noise, motion, and voice gently push the system in different directions.

This started as a way to explore noise as something you can *feel*, not only measure. I wanted a small world that reacts to motion, breath, and small disturbances, somewhere between sketch, instrument, and ongoing experiment.

This project is part of my creative coding and interaction research ✨

## Main Features

- Real-time particle simulation driven by procedural noise
- Two control modes:
  - `Manual` for direct parameter control
  - `Voice` for microphone-reactive behavior
- Pointer interaction with vortex-like flow influence
- Theme toggle (`dark` and `sand`)
- Persistent settings via `localStorage`
- Compact control panel with keyboard shortcuts

## Tech Stack

- TypeScript
- Vite
- HTML5 Canvas 2D
- Web Audio API (`getUserMedia`, `AnalyserNode`)
- Plain CSS

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Optional type-check:

```bash
npm run typecheck
```

## Controls & Interaction

Panel:

- Switch between `Manual` and `Voice` modes
- Adjust particle count, speed, noise scale/strength, turbulence, and trail
- `Pause`, `Reset`, and `Seed` actions
- Toggle microphone in Voice mode and watch input level feedback

Keyboard:

- `P` toggle pause/play
- `R` reset particles and flow
- `S` randomize seed
- `H` hide/show panel

## Voice Mode Note

Voice mode uses your microphone and maps incoming audio features (level, energy, spectral movement) into simulation parameters in real time. It is designed to be responsive but smooth, so the field returns to calm gradually after silence.

If microphone permission is denied, the UI will show that state and the app will stay in a safe fallback.

## Personal Note

I think of this as a living notebook: a place to test visual behavior, interaction rhythms, and how subtle voice input can shape motion.

It is intentionally open-ended and will keep evolving 🧚🏻‍♀️.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
