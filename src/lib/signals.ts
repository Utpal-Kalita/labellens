// Signal normalization: converts SmartSpectra SDK decoded metrics into
// LabelLens measurement rows. Rules (PRD section 5):
//  - never invent measurements when the SDK returns nothing
//  - store confidence/quality alongside values
//  - distinguish a missing signal from a genuine zero
//  - never interpret physiological changes as emotional states
import type { Measurement } from './types';

export const VALIDATION_HINTS: Record<number, { label: string; hint: string; quality: 'good' | 'poor' }> = {
  0: { label: 'Good signal', hint: 'Signal quality is good.', quality: 'good' },
  1: { label: 'No face found', hint: 'Face the camera directly.', quality: 'poor' },
  2: { label: 'Multiple faces', hint: 'Make sure only one person is in frame.', quality: 'poor' },
  3: { label: 'Face not centered', hint: 'Move to the center of the frame.', quality: 'poor' },
  5: { label: 'Too dark', hint: 'Improve the lighting on your face.', quality: 'poor' },
  6: { label: 'Too bright', hint: 'Reduce the light shining on your face.', quality: 'poor' },
  7: { label: 'Chest not visible', hint: 'Sit back so your head and chest are visible.', quality: 'poor' },
  10: { label: 'Camera tuning', hint: 'Hold still while the camera adjusts.', quality: 'poor' },
  11: { label: 'Frame rate low', hint: 'Close other apps using the camera.', quality: 'poor' },
  12: { label: 'Too much motion', hint: 'Keep your head still.', quality: 'poor' },
  13: { label: 'Too close', hint: 'Move a little further from the camera.', quality: 'poor' },
  14: { label: 'Too far', hint: 'Move a little closer to the camera.', quality: 'poor' },
  15: { label: 'Face too high', hint: 'Lower your face in the frame.', quality: 'poor' },
  16: { label: 'Face too low', hint: 'Raise your face in the frame.', quality: 'poor' },
  17: { label: 'Not facing camera', hint: 'Look directly at the camera.', quality: 'poor' },
};

const EXPRESSION_NAMES: Record<number, string> = {
  0: 'anger', 1: 'contempt', 2: 'disgust', 3: 'fear',
  4: 'happiness', 5: 'sadness', 6: 'surprise', 7: 'neutral',
};

export function expressionName(t: unknown): string | null {
  if (typeof t === 'number') return EXPRESSION_NAMES[t] ?? `class_${t}`;
  if (typeof t === 'string') return t;
  return null;
}

// Convert one decoded metrics payload into a Measurement row, or null when the
// payload carries no usable fields. `quality` comes from the latest validation
// event, never inferred.
export function normalizeMetrics(m: any, quality: string | null): Measurement | null {
  if (!m || typeof m !== 'object' || Array.isArray(m)) return null;
  const pulseSample = m.cardio?.pulseRate?.at(-1);
  const hrvSample = m.cardio?.hrv?.at(-1);
  const exprSample = m.face?.expression?.at(-1);
  const blink = m.face?.blinking?.at(-1);
  const talk = m.face?.talking?.at(-1);

  let expression: string | null = null;
  let expressionConfidence: number | null = null;
  if (exprSample?.scores?.length) {
    const top = exprSample.scores.reduce((a: any, b: any) => (b.confidence > a.confidence ? b : a));
    expression = expressionName(top.type ?? top.expressionType);
    expressionConfidence = typeof top.confidence === 'number' ? +(top.confidence.toFixed(3)) : null;
  }

  const row: Measurement = {
    timestamp: new Date().toISOString(),
    pulse: pulseSample && typeof pulseSample.value === 'number' ? +pulseSample.value.toFixed(1) : null,
    hrvRmssd: hrvSample && typeof hrvSample.rmssd === 'number' ? +hrvSample.rmssd.toFixed(2) : null,
    expression,
    expressionConfidence,
    blinking: blink ? !!blink.detected : null,
    talking: talk ? !!talk.detected : null,
    signalQuality: quality,
  };
  const hasAny = row.pulse !== null || row.hrvRmssd !== null || row.expression !== null || row.blinking !== null;
  return hasAny ? row : null;
}

// Descriptive statistics only — no significance claims (PRD section 7).
export function mean(xs: number[]): number | null {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
export function sd(xs: number[]): number | null {
  if (xs.length < 2) return null;
  const m = mean(xs)!;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}
