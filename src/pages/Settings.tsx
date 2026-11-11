import React, { useState } from 'react';
import { Card, PageTitle, Button, Field, inputCls } from '../components/ui';

export default function Settings() {
  const [key, setKey] = useState(() => localStorage.getItem('labellens.smartspectra.key') || '');
  const [saved, setSaved] = useState(false);
  return (
    <div className="max-w-2xl">
      <PageTitle title="Settings" sub="Local configuration and privacy controls." />
      <Card className="mb-6">
        <h2 className="font-semibold text-primary mb-2">SmartSpectra API key</h2>
        <p className="text-sm text-slate-600 mb-3">
          Get a free key from the <span className="font-mono text-xs">physiology.presagetech.com</span> developer portal.
          It is stored only in this app's local storage on this machine and is sent nowhere except to the SmartSpectra SDK.
        </p>
        <Field label="API key">
          <input className={inputCls} type="password" value={key} onChange={e => { setKey(e.target.value); setSaved(false); }} />
        </Field>
        <Button variant="primary" onClick={() => { localStorage.setItem('labellens.smartspectra.key', key); setSaved(true); }}>
          {saved ? 'Saved' : 'Save key'}
        </Button>
      </Card>
      <Card className="mb-6">
        <h2 className="font-semibold text-primary mb-2">Data handling</h2>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>All research data (sessions, responses, measurements, baselines) lives in a local SQLite database on this machine.</li>
          <li>Participant camera frames are processed on-device by the SmartSpectra SDK; LabelLens never records or stores participant video, facial images, or audio.</li>
          <li>Researcher-uploaded packaging design images are stored in the app data folder on this machine. They are study materials, not participant data.</li>
          <li>SmartSpectra telemetry is disabled in this app (enableTelemetry=false). The SDK still contacts Presage's servers to authenticate the API key; see Presage's telemetry & privacy documentation and privacy policy.</li>
          <li>Participants can stop a session at any time; their data can be deleted from the experiment's Sessions table.</li>
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold text-primary mb-2">Medical disclaimer</h2>
        <p className="text-sm text-slate-600">
          LabelLens is not a medical device. It does not diagnose, predict or treat any medical or psychological condition.
          Physiological measurements are observational research data, not indicators of emotional state, confusion or preference.
        </p>
      </Card>
    </div>
  );
}
