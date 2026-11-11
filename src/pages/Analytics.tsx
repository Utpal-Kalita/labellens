// Experiment analytics: descriptive statistics only.
// Never concludes that a participant was confused, stressed or preferred a
// design because a physiological value changed (PRD sections 6-7 + rules).
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/ipc';
import type { Experiment, ResponseRecord, SessionRow, MeasurementRow } from '../lib/types';
import { mean, median, sd } from '../lib/signals';
import { Card, PageTitle, Stat, Badge, Button } from '../components/ui';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, CartesianGrid } from 'recharts';

function fmtMs(ms: number | null): string {
  if (ms === null || ms === undefined) return '—';
  return (ms / 1000).toFixed(1) + 's';
}
function pct(x: number | null): string { return x === null ? '—' : (x * 100).toFixed(0) + '%'; }

export default function Analytics() {
  const { id = '' } = useParams();
  const [exp, setExp] = useState<Experiment | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [responses, setResponses] = useState<ResponseRecord[]>([]);
  const [measStats, setMeasStats] = useState<any>({ n: 0, pulse_n: 0 });
  const [selSession, setSelSession] = useState('');
  const [selResponse, setSelResponse] = useState('');
  const [sessionResponses, setSessionResponses] = useState<ResponseRecord[]>([]);
  const [timeline, setTimeline] = useState<MeasurementRow[]>([]);
  const [baseline, setBaseline] = useState<any>(null);

  useEffect(() => {
    api.getExperiment(id).then(d => setExp(d.experiment));
    api.experimentAnalytics(id).then(d => { setSessions(d.sessions); setResponses(d.responses); setMeasStats(d.measStats); });
  }, [id]);

  useEffect(() => {
    if (!selSession) { setSessionResponses([]); setTimeline([]); return; }
    api.sessionResponses(selSession).then(setSessionResponses);
    api.getBaseline(selSession).then(setBaseline);
  }, [selSession]);

  useEffect(() => {
    if (!selSession) return;
    api.sessionTimeline(selSession, selResponse || undefined).then(setTimeline);
  }, [selSession, selResponse]);

  const completed = sessions.filter(s => s.status === 'completed');
  const variants = useMemo(() => [...new Set(responses.map(r => r.variant_name).filter(Boolean))] as string[], [responses]);

  const variantStats = variants.map(v => {
    const rs = responses.filter(r => r.variant_name === v);
    const times = rs.map(r => r.completion_time_ms).filter((x): x is number => x !== null);
    const correct = rs.filter(r => r.is_correct !== null);
    const diffs = rs.map(r => r.difficulty_rating).filter((x): x is number => x !== null);
    return {
      variant: v,
      participants: new Set(rs.map(r => r.session_id)).size,
      meanTime: mean(times), medianTime: median(times),
      accuracy: correct.length ? correct.filter(r => r.is_correct === 1).length / correct.length : null,
      meanDifficulty: mean(diffs),
    };
  });

  const chartData = timeline.map(m => ({
    t: new Date(m.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
    pulse: m.pulse, hrv: m.hrvRmssd,
  }));
  const hasSimulated = timeline.some(m => m.source === 'simulated');

  if (!exp) return <div className="text-sm text-slate-500">Loading…</div>;
  const availability = measStats.n ? measStats.pulse_n / measStats.n : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageTitle title={`${exp.name} — analytics`} sub="Descriptive statistics only. Physiological values are observational data, never proof of confusion, stress or preference." />
        <Link to={`/experiments/${id}`}><Button variant="ghost">Back to experiment</Button></Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat label="Sessions" value={String(sessions.length)} hint={`${completed.length} completed`} />
        <Stat label="Avg completion" value={fmtMs(mean(responses.map(r => r.completion_time_ms).filter((x): x is number => x !== null)))} />
        <Stat label="Answer accuracy" value={pct((() => { const c = responses.filter(r => r.is_correct !== null); return c.length ? c.filter(r => r.is_correct === 1).length / c.length : null; })())} />
        <Stat label="Pulse data availability" value={availability === null ? '—' : pct(availability)} hint="Share of stored signal rows containing a pulse value" />
      </div>

      <h2 className="font-semibold text-primary mb-3">Packaging comparison</h2>
      <Card className="mb-8 overflow-x-auto">
        {variantStats.length ? (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2">Metric</th>{variantStats.map(v => <th key={v.variant} className="pb-2">Design {v.variant}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-line">
              <tr><td className="py-2 text-slate-500">Participants</td>{variantStats.map(v => <td key={v.variant} className="py-2">{v.participants}</td>)}</tr>
              <tr><td className="py-2 text-slate-500">Mean completion time</td>{variantStats.map(v => <td key={v.variant} className="py-2">{fmtMs(v.meanTime)}</td>)}</tr>
              <tr><td className="py-2 text-slate-500">Median completion time</td>{variantStats.map(v => <td key={v.variant} className="py-2">{fmtMs(v.medianTime)}</td>)}</tr>
              <tr><td className="py-2 text-slate-500">Correct responses</td>{variantStats.map(v => <td key={v.variant} className="py-2">{pct(v.accuracy)}</td>)}</tr>
              <tr><td className="py-2 text-slate-500">Mean reported difficulty</td>{variantStats.map(v => <td key={v.variant} className="py-2">{v.meanDifficulty === null ? '—' : v.meanDifficulty.toFixed(1) + '/5'}</td>)}</tr>
            </tbody>
          </table>
        ) : <p className="text-sm text-slate-500">No responses yet. Run a participant session to compare designs.</p>}
      </Card>

      <h2 className="font-semibold text-primary mb-3">Physiological timeline</h2>
      <Card className="mb-8">
        <div className="flex gap-3 mb-4 flex-wrap">
          <select className="rounded-lg border border-line px-3 py-2 text-sm" value={selSession} onChange={e => { setSelSession(e.target.value); setSelResponse(''); }}>
            <option value="">Select a session…</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.anonymous_code} · {s.start_time} · {s.status}</option>)}
          </select>
          <select className="rounded-lg border border-line px-3 py-2 text-sm" value={selResponse} onChange={e => setSelResponse(e.target.value)} disabled={!selSession}>
            <option value="">Whole session</option>
            {sessionResponses.map(r => <option key={r.id} value={r.id}>{r.task_title} ({fmtMs(r.completion_time_ms)})</option>)}
          </select>
          {hasSimulated && <Badge tone="sim">SIMULATED session — generated values, not measurements</Badge>}
        </div>
        {baseline?.pulse_mean !== null && baseline?.pulse_mean !== undefined && (
          <p className="text-xs text-slate-500 mb-2">Session baseline: mean pulse {baseline.pulse_mean?.toFixed(1)} BPM over {baseline.sample_count} samples. Timeline values can be compared against this participant's own starting point.</p>
        )}
        {timeline.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis yAxisId="pulse" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'BPM', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip />
              <Line yAxisId="pulse" type="monotone" dataKey="pulse" stroke="#2563EB" dot={false} strokeWidth={1.5} connectNulls={false} name="Pulse (BPM)" />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-500">{selSession ? 'No measurements in this selection.' : 'Select a session to inspect its physiological timeline.'}</p>}
        {selResponse && sessionResponses.find(r => r.id === selResponse) && (
          <div className="mt-3 text-xs text-slate-500">
            {(() => { const r = sessionResponses.find(x => x.id === selResponse)!; return (
              <>Task: <b>{r.task_title}</b> · completion {fmtMs(r.completion_time_ms)} · answer “{r.answer}” {r.is_correct === null ? '(unscored)' : r.is_correct ? '(correct)' : '(incorrect)'} · reported difficulty {r.difficulty_rating ?? '—'}/5</>
            ); })()}
          </div>
        )}
      </Card>

      <h2 className="font-semibold text-primary mb-3">Sessions</h2>
      <Card>
        {sessions.length ? (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2">Participant</th><th className="pb-2">Started</th><th className="pb-2">Status</th><th className="pb-2"></th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {sessions.map(s => (
                <tr key={s.id}>
                  <td className="py-2">{s.anonymous_code}</td>
                  <td className="py-2 text-slate-500">{s.start_time}</td>
                  <td className="py-2"><Badge tone={s.status === 'completed' ? 'good' : 'neutral'}>{s.status}</Badge></td>
                  <td className="py-2 text-right">
                    <button className="text-xs text-red-500 hover:underline"
                      onClick={async () => { if (confirm(`Delete all data for ${s.anonymous_code}? This cannot be undone.`)) { await api.deleteSessionData(s.id); const d = await api.experimentAnalytics(id); setSessions(d.sessions); setResponses(d.responses); } }}>
                      Delete data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-slate-500">No sessions yet.</p>}
      </Card>
    </div>
  );
}
