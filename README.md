# LabelLens

Understand how consumers interact with food packaging labels. LabelLens is a desktop research platform for structured packaging experiments: researchers build experiments, participants complete label-reading tasks on camera, and the app records task performance, participant feedback, and contactless physiological measurements via the Presage SmartSpectra SDK.

Built for the DEV **Presage SmartSpectra SDK Challenge** (#presagechallenge).

## What it does

- **Experiment builder** — create an experiment, upload 2+ packaging design images, and define tasks (or use templates: find the allergen info, compare sodium, find the expiry date, locate the barcode, find the net weight).
- **Guided participant sessions** — explicit camera consent, signal calibration with a quality gate, a 30-second neutral baseline, then randomized task flow across packaging variants.
- **Contactless measurement** — pulse rate, HRV, breathing, expressions and blinking from the live camera stream via SmartSpectra. No raw video, no facial images, and no audio are ever stored.
- **Analytics** — descriptive statistics only: completion time (mean/median), answer accuracy, self-reported difficulty, pulse data availability, and per-session physiological timelines with baseline comparison.

## Data flow

- **Participant camera frames:** Presage's current SDK policy says frames are processed on the computer running the app and are not sent to Presage. LabelLens itself does not record or upload participant video, face photos or audio. The native SDK's full network behavior has not been independently verified. No remote-camera forwarding is part of this design.
- **Local research records:** LabelLens saves derived measurements, answers, timings, consent and baselines in `labellens.db` in the app's user-data folder. Packaging images are separate local study materials. Records have no automatic expiry. Session deletion removes local application records, not device backups or provider-held data, and is not a secure-erasure guarantee.
- **SDK cloud processing:** Presage's [current SDK privacy policy](https://presagetech.com/legal/privacy-policy/) (SDK sections 4.2, 4.4 and 7.4) says derived measurements are automatically sent to Presage for AI Insights, processed with Anthropic, and this cannot currently be switched off. LabelLens does not call on-demand `requestInsight`; that does not establish the absence of native-runtime measurement sharing.
- **Telemetry is a narrower setting:** LabelLens sets `enableTelemetry=false`, opting out of optional SDK telemetry. Authentication, model delivery, usage records and Insights are separate from that opt-out. See [SDK Telemetry & Privacy](https://smartspectra.presagetech.com/docs/telemetry-and-privacy.md).
- **Provider retention and deletion:** Presage's SDK policy says Insights requests and responses are kept while the developer account is active and for up to 60 days after closure; backups may persist for up to 90 days. Other retention exceptions and separate deletion requests are described in SDK policy sections 10 and 11. Deleting a LabelLens session does not delete records held by Presage or its processors.
- **Verification status:** Node SDK 3.5.0's JavaScript wrapper exposes on-demand Insights and telemetry controls, but its measurement engine is native. Until behavior is independently resolved, this disclosure follows the broader current vendor policy. Participants must see and agree to the full disclosure before a live session.

## Guardrails (by design)

- Explicit, recorded consent before any camera use, including the data-handling disclosure above; participants can stop at any time and delete their data.
- Local storage and local deletion do not imply the SDK sends no derived measurements. Provider processing is disclosed separately above.
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
