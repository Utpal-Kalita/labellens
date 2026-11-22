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
          It is stored in this app's local settings and supplied to the SmartSpectra SDK for authenticated service use. It is not a guarantee that the SDK operates offline. Review the SDK data-sharing disclosure below before any live session.
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
          <li>LabelLens stores sessions, responses, measurements, baselines and consent in a local SQLite database, with no automatic expiry.</li>
          <li>Presage says its SDK processes camera frames on the computer running the app and does not send face images or video to Presage. LabelLens itself does not record or upload participant video, face photos or audio. All native SDK network traffic has not been independently verified.</li>
          <li>Researcher-uploaded packaging images are local study materials, not participant camera data.</li>
          <li>Presage's current SDK privacy policy says derived measurements are automatically sent to Presage for AI Insights, processed with Anthropic, and this cannot currently be disabled. LabelLens does not call on-demand Insights, but that does not prove the native SDK sends no measurements.</li>
          <li>Optional SDK telemetry is disabled (enableTelemetry=false). Authentication, model delivery, usage records and Insights are separate from this opt-out.</li>
          <li>Participants can stop and request local session deletion from the experiment's Sessions table. Local deletion does not remove provider-held data. Presage's policy describes retention and separate deletion requests; Insights records may remain while the account is active and up to 60 days after closure, with backups up to 90 days.</li>
          <li>SDK policy: <span className="font-mono text-xs break-all">https://presagetech.com/legal/privacy-policy/</span>. No remote-camera forwarding is included in this design.</li>
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
