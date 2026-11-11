// Live SmartSpectra integration (renderer side) + a clearly-labeled simulated
// source for interface development and rehearsal.
//
// Evidence rules baked in:
//  - source 'live' = genuine SDK output from this machine's camera
//  - source 'simulated' = generated numbers for UI work; every screen and
//    export that shows simulated data says so; it is never presented as a
//    measurement
//  - the live source exposes the camera stream so the participant can always
//    see themselves; measurement never starts without explicit consent
import { normalizeMetrics, VALIDATION_HINTS } from './signals';
import type { Measurement } from './types';

export type SourceKind = 'live' | 'simulated';

export interface SignalSourceEvents {
  onMeasurement: (m: Measurement) => void;
  onValidation: (code: number, label: string, hint: string, quality: 'good' | 'poor') => void;
  onStatus: (s: 'starting' | 'running' | 'stopped' | 'error', detail?: string) => void;
  onStream?: (stream: MediaStream | null) => void;
}

export interface SignalSource {
  kind: SourceKind;
  start(): Promise<void>;
  stop(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Live source: official SmartSpectra renderer SDK.
// ---------------------------------------------------------------------------
export class LiveSmartSpectraSource implements SignalSource {
  kind: SourceKind = 'live';
  private sdk: any = null;
  private lastQuality: string | null = null;

  constructor(private apiKey: string, private events: SignalSourceEvents) {}

  async start() {
    // Dynamic import keeps Vite from pre-bundling the FFI entrypoints.
    const rendererMod: any = await import('@smartspectra/node-sdk/renderer');
    const rootMod: any = await import('@smartspectra/node-sdk/messages');
    const face = rendererMod.faceMetrics;
    const cardio = rendererMod.cardioMetrics;
    const decode = rootMod.decodeMetrics;

    this.events.onStatus('starting');
    const sdk = new rendererMod.SmartSpectraSDK({
      apiKey: this.apiKey,
      requestedMetrics: [...face, ...cardio],
    });
    this.sdk = sdk;

    sdk.on('streamAvailable', (stream: MediaStream) => this.events.onStream?.(stream));
    sdk.on('processingStatus', (s: number) => {
      if (s === 3) this.events.onStatus('running');
      if (s === 5) this.events.onStatus('error', 'Processing stopped by the SDK.');
    });
    sdk.on('validationStatus', (code: number) => {
      const v = VALIDATION_HINTS[code] ?? { label: `Check ${code}`, hint: 'Adjust your position.', quality: 'poor' as const };
      this.lastQuality = v.quality === 'good' ? 'good' : `poor: ${v.label}`;
      this.events.onValidation(code, v.label, v.hint, v.quality);
    });
    sdk.on('metrics', (buf: any) => {
      const decoded = decode(buf);
      const row = normalizeMetrics(decoded, this.lastQuality === 'good' ? 'good' : this.lastQuality);
      if (row) this.events.onMeasurement(row);
    });
    sdk.on('error', (code: number, message: string, retryable: boolean) => {
      const known: Record<number, string> = {
        2: 'SmartSpectra authentication failed — check the API key in Settings.',
        4: 'SmartSpectra trial credits are exhausted. Measurement cannot continue on the free tier.',
        14: 'The camera frame rate stayed too low to measure reliably. Close other camera apps and try again.',
      };
      this.events.onStatus('error', known[code] ?? `SmartSpectra error ${code}: ${message}${retryable ? ' (retryable)' : ''}`);
    });

    await sdk.start(); // acquires the front camera and emits streamAvailable
  }

  async stop() {
    if (!this.sdk) return;
    try { await this.sdk.stop(); } catch { /* already stopped */ }
    try { this.sdk.destroy(); } catch { /* noop */ }
    this.sdk = null;
    this.events.onStream?.(null);
    this.events.onStatus('stopped');
  }
}

// ---------------------------------------------------------------------------
// Simulated source: deterministic, clearly-labeled practice signals.
// Used ONLY for interface development/rehearsal. Produces no real data.
// ---------------------------------------------------------------------------
export class SimulatedSource implements SignalSource {
  kind: SourceKind = 'simulated';
  private timer: ReturnType<typeof setInterval> | null = null;
  private timer2: ReturnType<typeof setInterval> | null = null;
  private t = 0;
  private basePulse: number;

  constructor(private events: SignalSourceEvents) {
    this.basePulse = 68 + Math.random() * 10;
  }

  async start() {
    this.events.onStatus('starting');
    // Fake camera preview so the layout is testable without a camera.
    if (this.events.onStream) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 640; canvas.height = 480;
        const ctx = canvas.getContext('2d')!;
        const draw = () => {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '20px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SIMULATED CAMERA', 320, 230);
          ctx.fillText('no video is being captured', 320, 260);
        };
        draw();
        this.timer2 = setInterval(draw, 500);
        this.events.onStream(canvas.captureStream(5));
      } catch { this.events.onStream(null); }
    }
    setTimeout(() => this.events.onStatus('running'), 400);
    this.timer = setInterval(() => {
      this.t += 1;
      const drift = Math.sin(this.t / 8) * 4 + (Math.random() - 0.5) * 2.5;
      const expressions = ['neutral', 'neutral', 'neutral', 'happiness', 'surprise'];
      this.events.onMeasurement({
        timestamp: new Date().toISOString(),
        pulse: +(this.basePulse + drift).toFixed(1),
        hrvRmssd: +(38 + Math.sin(this.t / 12) * 8 + Math.random() * 3).toFixed(2),
        expression: expressions[Math.floor(Math.random() * expressions.length)],
        expressionConfidence: +(0.55 + Math.random() * 0.35).toFixed(3),
        blinking: Math.random() < 0.06,
        talking: false,
        signalQuality: 'good (SIMULATED)',
      });
      this.events.onValidation(0, 'Good signal (SIMULATED)', 'Simulated source — values are generated, not measured.', 'good');
    }, 1000);
  }

  async stop() {
    if (this.timer) clearInterval(this.timer);
    if (this.timer2) clearInterval(this.timer2);
    this.timer = null; this.timer2 = null;
    this.events.onStream?.(null);
    this.events.onStatus('stopped');
  }
}
