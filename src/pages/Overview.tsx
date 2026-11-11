import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/ipc';
import type { Experiment } from '../lib/types';
import { Card, PageTitle, Stat, Button } from '../components/ui';

export default function Overview() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [err, setErr] = useState('');
  useEffect(() => { api.listExperiments().then(setExperiments).catch(e => setErr(String(e))); }, []);
  const completed = experiments.reduce((a, e) => a + (e.completed_sessions || 0), 0);
  return (
    <div>
      <PageTitle title="LabelLens" sub="Understand how consumers interact with food labels — task performance, participant feedback, and contactless physiological observations." />
      {err && <Card className="mb-4 text-sm text-red-600">{err}</Card>}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Experiments" value={String(experiments.length)} />
        <Stat label="Completed sessions" value={String(completed)} />
        <Stat label="Data storage" value="On this machine" hint="Research data lives in local SQLite; participant camera is processed on-device and never recorded" />
      </div>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-primary">How it works</h2>
          <Link to="/experiments"><Button variant="accent">New experiment</Button></Link>
        </div>
        <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
          <li>Create an experiment and upload two or more packaging designs.</li>
          <li>Build tasks (find the allergen info, compare sodium, …) or use the templates.</li>
          <li>Run participant sessions: explicit camera consent, signal calibration, a baseline, then the tasks while SmartSpectra measures pulse, expressions and blinking.</li>
          <li>Compare designs: completion time, accuracy, reported difficulty, and the physiological timeline — described, never diagnosed.</li>
        </ol>
      </Card>
    </div>
  );
}
