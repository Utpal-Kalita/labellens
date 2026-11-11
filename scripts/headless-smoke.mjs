// headless-smoke.mjs — SmartSpectra SDK integration smoke test (NO camera).
// Feeds SYNTHETIC frames (solid-color, no face) through the real SDK to prove:
//   1. API key authenticates (no kAuthenticationFailed=2)
//   2. Trial credits available (no kCreditExhausted=4)
//   3. Frame pipeline runs at sustained rate (no kSustainedLowFrameRate=14)
//   4. Validation/metrics events arrive and decode.
// This is NOT a measurement proof: synthetic frames contain no face, so
// kNoFaceFound validation is EXPECTED. Live measurement proof happens on a
// camera-equipped machine or with consented recorded input.
import { SmartSpectraSDK, FrameTransform, PixelFormat, faceMetrics, cardioMetrics, SmartSpectraLogLevel } from '@smartspectra/node-sdk';
import { decodeMetrics } from '@smartspectra/node-sdk/messages';
import fs from 'node:fs';

const keyPath = process.env.SMARTSPECTRA_KEY_FILE;
if (!keyPath) { console.error('Set SMARTSPECTRA_KEY_FILE'); process.exit(2); }
const apiKey = fs.readFileSync(keyPath, 'utf8').trim();

const W = 640, H = 480, FPS = 15, SECONDS = 20;
const frame = Buffer.alloc(W * H * 3);
// gradient pattern so frames are not all-identical zeros
for (let i = 0; i < W * H; i++) { frame[i*3] = i % 251; frame[i*3+1] = (i*7) % 253; frame[i*3+2] = (i*13) % 255; }

const events = { processing: [], validation: {}, metrics: 0, metricSamples: [], errors: [] };
const sdk = new SmartSpectraSDK({
  apiKey,
  requestedMetrics: [...faceMetrics, ...cardioMetrics],
  logLevel: SmartSpectraLogLevel.kWarning,
});
sdk.on('processingStatus', (s) => { events.processing.push(s); console.log('[processing]', s); });
sdk.on('validationStatus', (code, ts, hint) => { events.validation[code] = (events.validation[code]||0)+1; });
sdk.on('metrics', (buf, ts) => {
  events.metrics++;
  if (events.metricSamples.length < 3) {
    const m = decodeMetrics(buf);
    events.metricSamples.push(Buffer.isBuffer(m) ? 'raw-buffer' : JSON.stringify(Object.keys(m)));
  }
});
sdk.on('error', (code, msg, retryable) => { events.errors.push({code, msg, retryable}); console.log('[error]', code, msg, 'retryable=', retryable); });

sdk.useCustomInput(FrameTransform.kNone);
sdk.start();

const t0 = process.hrtime.bigint();
let sent = 0;
const intervalMs = 1000 / FPS;
await new Promise((resolve) => {
  const timer = setInterval(() => {
    const elapsed = Number(process.hrtime.bigint() - t0) / 1e9;
    if (elapsed >= SECONDS) { clearInterval(timer); resolve(); return; }
    const tsUs = process.hrtime.bigint() / 1000n; // monotonic microseconds
    sdk.sendFrame(frame, W, H, W * 3, PixelFormat.kRGB, tsUs);
    sent++;
  }, intervalMs);
});

await sdk.stopAsync();
await sdk.destroy();

const errCodes = events.errors.map(e => e.code);
const summary = {
  framesSent: sent,
  targetFps: FPS,
  durationS: SECONDS,
  metricsEvents: events.metrics,
  metricSamples: events.metricSamples,
  validationCounts: events.validation,
  errorCodes: errCodes,
  authOk: !errCodes.includes(2),
  creditsOk: !errCodes.includes(4),
  noSustainedLowFrameRate: !errCodes.includes(14),
};
console.log('SMOKE SUMMARY ' + JSON.stringify(summary, null, 2));
process.exit(events.errors.some(e => [2,4].includes(e.code)) ? 1 : 0);
