# LabelLens

Understand how consumers interact with food packaging labels. LabelLens is a desktop research platform for structured packaging experiments: researchers build experiments, participants complete label-reading tasks on camera, and the app records task performance, participant feedback, and contactless physiological measurements via the Presage SmartSpectra SDK.

Built for the DEV **Presage SmartSpectra SDK Challenge** (#presagechallenge).

## What it does

- **Experiment builder** — create an experiment, upload 2+ packaging design images, and define tasks (or use templates: find the allergen info, compare sodium, find the expiry date, locate the barcode, find the net weight).
- **Guided participant sessions** — explicit camera consent, signal calibration with a quality gate, a 30-second neutral baseline, then randomized task flow across packaging variants.
- **Contactless measurement** — pulse rate, HRV, breathing, expressions and blinking from the live camera stream via SmartSpectra. No raw video, no facial images, and no audio are ever stored.
- **Analytics** — descriptive statistics only: completion time (mean/median), answer accuracy, self-reported difficulty, pulse data availability, and per-session physiological timelines with baseline comparison.

## Guardrails (by design)

- Explicit, recorded consent before any camera use; participants can stop at any time and delete their data.
- All data stays in a local SQLite database on the researcher's machine.
- Descriptive statistics only. The app never claims a participant was confused, stressed, or preferred a design because a physiological value changed.
- Not a medical device. Measurements are observational research data.
- The simulated measurement source (for development without a camera) is visibly labeled everywhere and is never presented as a real measurement.

## Setup

Prerequisites: Node.js 20+, a webcam, and a free SmartSpectra API key from [physiology.presagetech.com](https://physiology.presagetech.com).

```bash
npm install
npm run dev        # starts Vite + Electron
# or
npm run build && npm start
```

Enter your SmartSpectra API key in **Settings** (stored only in this app's local storage on your machine). Without a key, sessions run on the clearly labeled simulated source.

## Project layout

- `electron/` — main process (window, local SQLite DB via sql.js, IPC), preload bridge
- `src/pages/` — Overview, Experiments, ExperimentDetail, Session (participant flow), Analytics, Settings
- `src/lib/` — types, SmartSpectra live/simulated sources, signal normalization and stats
- `scripts/` — headless SDK smoke tests (integration verification)
- `test-assets/` — synthetic test frames (AI-generated fictional person, labeled, never presented as human measurement)

## Tech

Electron · React 18 · Vite · Tailwind · Recharts · sql.js (SQLite) · @smartspectra/node-sdk 3.5

## License

MIT
