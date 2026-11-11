// Participant testing session — the P0 flow from the PRD:
// welcome → consent → camera init/calibration → baseline → tasks → feedback → done.
// Measurement source is chosen by the researcher: live SmartSpectra (genuine)
// or a clearly-labeled simulated rehearsal. Simulated sessions are marked and
// never presented as measurements.
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/ipc';
import { LiveSmartSpectraSource, SimulatedSource, SignalSource } from '../lib/sdk';
import type { Experiment, Packaging, Task, Measurement, SessionInfo } from '../lib/types';
import { mean, sd } from '../lib/signals';
import { Button, Card, Badge, inputCls } from '../components/ui';

type Phase = 'setup' | 'welcome' | 'consent' | 'calibration' | 'baseline' | 'task' | 'feedback' | 'complete';

const BASELINE_S = 30;

export default function SessionPage() {
  const { experimentId = '' } = useParams();
  const nav = useNavigate();
  const [exp, setExp] = useState<Experiment | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<'live' | 'simulated'>('live');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('labellens.smartspectra.key') || '');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [consent, setConsent] = useState(false);
  const [validation, setValidation] = useState<{ code: number; label: string; hint: string; quality: 'good' | 'poor' } | null>(null);
  const [status, setStatus] = useState<'starting' | 'running' | 'stopped' | 'error'>('stopped');
  const [statusDetail, setStatusDetail] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [baselineLeft, setBaselineLeft] = useState(BASELINE_S);
  const [taskIdx, setTaskIdx] = useState(0);
  const [variantIdx, setVariantIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [difficulty, setDifficulty] = useState(0);
  const [difficultyNote, setDifficultyNote] = useState('');
  const [taskStartedAt, setTaskStartedAt] = useState(0);

  const sourceRef = useRef<SignalSource | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bufferRef = useRef<Measurement[]>([]);
  const responseIdRef = useRef<string | null>(null);
  const baselinePulses = useRef<number[]>([]);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.getExperiment(experimentId).then(async d => {
      setExp(d.experiment); setTasks(d.tasks); setPackaging(d.packaging);
      const imgs: Record<string, string> = {};
      for (const p of d.packaging) { const data = await api.getPackagingImage(p.id); if (data) imgs[p.id] = data; }
      setImages(imgs);
    });
    return () => { stopSource(); };
  }, [experimentId]);

  useEffect(() => { if (videoRef.current && stream) { videoRef.current.srcObject = stream; } }, [stream, phase]);

  const flush = async () => {
    if (!session || !bufferRef.current.length) return;
    const rows = bufferRef.current.splice(0, bufferRef.current.length);
    await api.recordMeasurements(session.sessionId, responseIdRef.current,
      phase === 'baseline' ? 'baseline' : 'task', mode === 'live' ? 'live' : 'simulated', rows);
  };

  const startSource = async (kind: 'live' | 'simulated') => {
    const events = {
      onMeasurement: (m: Measurement) => {
        bufferRef.current.push(m);
        if (phase === 'baseline' && m.pulse !== null) baselinePulses.current.push(m.pulse);
      },
      onValidation: (code: number, label: string, hint: string, quality: 'good' | 'poor') => setValidation({ code, label, hint, quality }),
      onStatus: (s: any, detail?: string) => { setStatus(s); setStatusDetail(detail || ''); },
      onStream: (st: MediaStream | null) => setStream(st),
    };
    const src = kind === 'live' ? new LiveSmartSpectraSource(apiKey, events) : new SimulatedSource(events);
    sourceRef.current = src;
    try { await src.start(); } catch (e: any) { setStatus('error'); setStatusDetail(String(e?.message || e)); }
    flushTimer.current = setInterval(flush, 3000);
  };

  const stopSource = async () => {
    if (flushTimer.current) { clearInterval(flushTimer.current); flushTimer.current = null; }
    await flush();
    if (sourceRef.current) { await sourceRef.current.stop(); sourceRef.current = null; }
  };

  const beginSession = async () => {
    if (mode === 'live') localStorage.setItem('labellens.smartspectra.key', apiKey);
    const s = await api.startSession(experimentId);
    setSession(s);
    setPhase('welcome');
  };

  const giveConsent = async () => {
    if (!session) return;
    await api.recordConsent(session.participantId);
    setConsent(true);
    setPhase('calibration');
    await startSource(mode);
  };

  const startBaseline = async () => {
    baselinePulses.current = [];
    setBaselineLeft(BASELINE_S);
    setPhase('baseline');
    const startedAt = new Date().toISOString();
    const t = setInterval(() => {
      setBaselineLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          const pulses = baselinePulses.current;
          api.recordBaseline({
            sessionId: session!.sessionId, startedAt, durationS: BASELINE_S,
            pulseMean: mean(pulses), pulseSd: sd(pulses), sampleCount: pulses.length,
          });
          setTaskIdx(0); setVariantIdx(0); startTask(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const currentVariantId = session?.variantOrder[variantIdx] || null;
  const tasksForVariant = tasks.filter(t => !t.packaging_id || t.packaging_id === currentVariantId);

  const startTask = (idx: number) => {
    setAnswer(''); setDifficulty(0); setDifficultyNote('');
    responseIdRef.current = null;
    setTaskIdx(idx);
    setTaskStartedAt(Date.now());
    setPhase('task');
  };

  const submitAnswer = () => setPhase('feedback');

  const submitFeedback = async () => {
    if (!session) return;
    const task = tasksForVariant[taskIdx];
    const completedAt = new Date().toISOString();
    const expected = (task.expected_answer || '').trim().toLowerCase();
    const given = answer.trim().toLowerCase();
    const isCorrect = expected ? (given === expected || given.includes(expected) || expected.includes(given)) : null;
    const rec = await api.recordResponse({
      sessionId: session.sessionId, taskId: task.id, packagingId: currentVariantId,
      answer, isCorrect, startedAt: new Date(taskStartedAt).toISOString(), completedAt,
      completionTimeMs: Date.now() - taskStartedAt, difficultyRating: difficulty || null, difficultyNote,
    });
    responseIdRef.current = rec.id;
    // Link this task's measurements to the recorded response.
    await api.assignMeasurements(session.sessionId, rec.id, new Date(taskStartedAt).toISOString());
    await flush();
    const next = taskIdx + 1;
    if (next < tasksForVariant.length) { startTask(next); }
    else if (variantIdx + 1 < (session?.variantOrder.length || 0)) { setVariantIdx(variantIdx + 1); setTaskIdx(0); startTask(0); }
    else { await stopSource(); await api.completeSession(session.sessionId); setPhase('complete'); }
  };

  const abandon = async () => {
    await stopSource();
    if (session) await api.abandonSession(session.sessionId);
    nav(`/experiments/${experimentId}`);
  };

  if (!exp) return <div className="text-sm text-slate-500">Loading…</div>;
  const task = tasksForVariant[taskIdx];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-primary">{exp.name}</h1>
          {session && <div className="text-xs text-slate-400">Participant {session.code}</div>}
        </div>
        <div className="flex items-center gap-2">
          {mode === 'simulated' && <Badge tone="sim">SIMULATED REHEARSAL — not a measurement</Badge>}
          {phase !== 'setup' && phase !== 'complete' && <Button variant="ghost" onClick={abandon}>End session</Button>}
        </div>
      </div>

      {phase === 'setup' && (
        <Card>
          <h2 className="font-semibold text-primary mb-2">Set up this session</h2>
          <p className="text-sm text-slate-600 mb-4">Choose how signals are captured for this participant.</p>
          <div className="space-y-3 mb-4">
            <label className={`block border rounded-xl p-4 cursor-pointer ${mode === 'live' ? 'border-accent bg-blue-50' : 'border-line'}`}>
              <input type="radio" className="mr-2" checked={mode === 'live'} onChange={() => setMode('live')} />
              <span className="font-medium text-sm">Live measurement</span>
              <span className="block text-xs text-slate-500 mt-1">Presage SmartSpectra measures pulse, expressions and blinking from this machine's camera. Uses the researcher's SmartSpectra API key (stored only on this machine).</span>
            </label>
            <label className={`block border rounded-xl p-4 cursor-pointer ${mode === 'simulated' ? 'border-violet-400 bg-violet-50' : 'border-line'}`}>
              <input type="radio" className="mr-2" checked={mode === 'simulated'} onChange={() => setMode('simulated')} />
              <span className="font-medium text-sm">Simulated rehearsal</span>
              <span className="block text-xs text-slate-500 mt-1">Walk through the flow with generated placeholder values. Clearly labeled everywhere. No camera, no measurement.</span>
            </label>
          </div>
          {mode === 'live' && (
            <div className="mb-4">
              <span className="block text-sm font-medium text-slate-700 mb-1">SmartSpectra API key</span>
              <input className={inputCls} type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Stored only in this app's local storage" />
            </div>
          )}
          <Button variant="accent" disabled={mode === 'live' && !apiKey.trim()} onClick={beginSession}>Continue</Button>
        </Card>
      )}

      {phase === 'welcome' && (
        <Card>
          <h2 className="font-semibold text-primary mb-2">Welcome</h2>
          <p className="text-sm text-slate-600 mb-3">{exp.description || exp.objective || 'Thank you for taking part in this packaging research study.'}</p>
          <ul className="text-sm text-slate-600 space-y-1 mb-4 list-disc list-inside">
            <li>You will look at packaging designs and answer short questions about them.</li>
            <li>It takes about {Math.max(2, Math.round(tasks.length * 1.5))} minutes.</li>
            <li>There are no right or wrong first impressions — answer what you actually find.</li>
          </ul>
          <Button variant="accent" onClick={() => setPhase('consent')}>Start experiment</Button>
        </Card>
      )}

      {phase === 'consent' && (
        <Card>
          <h2 className="font-semibold text-primary mb-2">Camera consent</h2>
          {mode === 'live' ? (
            <div className="text-sm text-slate-600 space-y-2 mb-4">
              <p>This study uses your camera with Presage SmartSpectra to record physiological measurements while you complete the tasks:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Pulse rate and heart-rate variability</li>
                <li>Facial-expression classifications and blinking</li>
                <li>How long each task takes, your answers, and your difficulty ratings</li>
              </ul>
              <p className="font-medium">What is NOT collected:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>No raw video is recorded or stored</li>
                <li>No photos of your face are saved</li>
                <li>Nothing is uploaded — research data stays in a local database on this machine</li>
              </ul>
              <p>These measurements are observational research data. They are not medical readings and are never used to diagnose your emotions or health. You can stop at any time, and you can ask for your session data to be deleted.</p>
            </div>
          ) : (
            <p className="text-sm text-slate-600 mb-4">This is a simulated rehearsal. No camera is used and no real measurements are taken. Values are generated placeholders for practicing the workflow.</p>
          )}
          <div className="flex gap-3">
            <Button variant="accent" onClick={giveConsent}>{mode === 'live' ? 'I consent — turn on the camera' : 'Continue'}</Button>
            <Button variant="ghost" onClick={abandon}>Decline</Button>
          </div>
        </Card>
      )}

      {(phase === 'calibration' || phase === 'baseline' || phase === 'task' || phase === 'feedback') && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <Card className="p-3">
              <video ref={videoRef} autoPlay playsInline muted className="rounded-lg w-full aspect-[4/3] bg-slate-900 object-cover" />
              <div className="mt-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${validation?.quality === 'good' && status === 'running' ? 'bg-success' : 'bg-warning'}`} />
                <span className="text-xs text-slate-600">{status === 'running' ? (validation?.label || 'Measuring') : status === 'starting' ? 'Starting camera…' : status === 'error' ? 'Signal problem' : 'Camera off'}</span>
              </div>
              {validation && validation.quality === 'poor' && status === 'running' && (
                <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800">
                  Signal quality is low. {validation.hint}
                </div>
              )}
              {status === 'error' && <div className="mt-2 text-xs bg-red-50 border border-red-200 rounded-lg p-2 text-red-700">{statusDetail}</div>}
            </Card>
          </div>
          <div className="col-span-2">
            {phase === 'calibration' && (
              <Card>
                <h2 className="font-semibold text-primary mb-2">Camera check</h2>
                <ul className="text-sm text-slate-600 space-y-1 mb-4 list-disc list-inside">
                  <li>Sit so your head and chest are visible in the frame.</li>
                  <li>Face the camera with even lighting on your face.</li>
                  <li>Stay comfortably still during measurements.</li>
                </ul>
                <Button variant="accent" disabled={status !== 'running'} onClick={startBaseline}>
                  {status === 'running' ? `Start ${BASELINE_S}s baseline` : 'Waiting for signal…'}
                </Button>
              </Card>
            )}
            {phase === 'baseline' && (
              <Card>
                <h2 className="font-semibold text-primary mb-2">Baseline measurement</h2>
                <p className="text-sm text-slate-600 mb-4">Relax and look at the camera. This records your personal starting point so later readings can be compared against it.</p>
                <div className="text-4xl font-semibold text-primary tabular-nums">{baselineLeft}s</div>
              </Card>
            )}
            {phase === 'task' && task && (
              <Card>
                <div className="text-xs text-slate-400 mb-1">Variant {packaging.find(p => p.id === currentVariantId)?.variant_name} · Task {taskIdx + 1} of {tasksForVariant.length}</div>
                <h2 className="font-semibold text-primary mb-3">{task.instruction}</h2>
                {currentVariantId && images[currentVariantId] && (
                  <img src={images[currentVariantId]} alt="Packaging design" className="rounded-lg border border-line max-h-72 object-contain mb-4 bg-white" />
                )}
                {task.answer_type === 'multiple_choice' ? (
                  <div className="space-y-2 mb-4">
                    {(JSON.parse(task.options || '[]') as string[]).map(opt => (
                      <label key={opt} className={`block border rounded-lg px-3 py-2 text-sm cursor-pointer ${answer === opt ? 'border-accent bg-blue-50' : 'border-line'}`}>
                        <input type="radio" className="mr-2" checked={answer === opt} onChange={() => setAnswer(opt)} />{opt}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input className={`${inputCls} mb-4`} type={task.answer_type === 'numeric' ? 'number' : 'text'} value={answer}
                    onChange={e => setAnswer(e.target.value)} placeholder="Your answer" autoFocus />
                )}
                <Button variant="accent" disabled={!answer.trim()} onClick={submitAnswer}>Submit answer</Button>
              </Card>
            )}
            {phase === 'feedback' && (
              <Card>
                <h2 className="font-semibold text-primary mb-2">How difficult was that information to find?</h2>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setDifficulty(n)}
                      className={`w-11 h-11 rounded-lg border text-sm font-medium ${difficulty === n ? 'bg-accent text-white border-accent' : 'border-line hover:border-accent'}`}>{n}</button>
                  ))}
                </div>
                <div className="text-xs text-slate-400 mb-3">1 = very easy, 5 = very difficult</div>
                <textarea className={`${inputCls} mb-4`} rows={2} value={difficultyNote} onChange={e => setDifficultyNote(e.target.value)}
                  placeholder="Optional: what made it easy or hard to find?" />
                <Button variant="accent" disabled={!difficulty} onClick={submitFeedback}>
                  {taskIdx + 1 < tasksForVariant.length ? 'Next task' : variantIdx + 1 < (session?.variantOrder.length || 0) ? 'Next design' : 'Finish'}
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {phase === 'complete' && (
        <Card className="text-center py-10">
          <h2 className="text-xl font-semibold text-primary mb-2">Experiment completed</h2>
          <p className="text-sm text-slate-600 mb-1">Thank you for participating. Your responses have been recorded.</p>
          <p className="text-xs text-slate-400 mb-6">Your data is stored locally on this machine and can be deleted on request.</p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => nav(`/experiments/${experimentId}/analytics`)}>View analytics</Button>
            <Button variant="accent" onClick={() => nav(`/experiments/${experimentId}`)}>Back to experiment</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
