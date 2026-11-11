import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/ipc';
import type { Experiment } from '../lib/types';
import { Button, Card, PageTitle, Field, inputCls, Badge } from '../components/ui';

export default function Experiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', objective: '', productCategory: '', description: '', participantTarget: 5 });
  const load = () => api.listExperiments().then(setExperiments);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    await api.createExperiment(form);
    setForm({ name: '', objective: '', productCategory: '', description: '', participantTarget: 5 });
    setCreating(false);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageTitle title="Experiments" sub="Each experiment compares packaging designs through structured participant tasks." />
        <Button variant="accent" onClick={() => setCreating(!creating)}>{creating ? 'Cancel' : 'New experiment'}</Button>
      </div>
      {creating && (
        <Card className="mb-6">
          <Field label="Experiment name"><input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Protein rice — label redesign" /></Field>
          <Field label="Research objective"><input className={inputCls} value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} placeholder="Which nutritional label layout do consumers read faster and more accurately?" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product category"><input className={inputCls} value={form.productCategory} onChange={e => setForm({ ...form, productCategory: e.target.value })} placeholder="Packaged food" /></Field>
            <Field label="Participant target"><input className={inputCls} type="number" min={1} value={form.participantTarget} onChange={e => setForm({ ...form, participantTarget: +e.target.value })} /></Field>
          </div>
          <Field label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <Button variant="primary" onClick={create} disabled={!form.name.trim()}>Create experiment</Button>
        </Card>
      )}
      <div className="space-y-3">
        {experiments.map(e => (
          <Link key={e.id} to={`/experiments/${e.id}`}>
            <Card className="hover:border-accent transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-primary">{e.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{e.objective || e.product_category || 'No objective set'}</div>
                </div>
                <div className="flex gap-2">
                  <Badge>{e.packaging_count || 0} designs</Badge>
                  <Badge>{e.task_count || 0} tasks</Badge>
                  <Badge tone={e.completed_sessions ? 'good' : 'neutral'}>{e.completed_sessions || 0} sessions</Badge>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {!experiments.length && <Card className="text-sm text-slate-500">No experiments yet. Create one to start testing packaging.</Card>}
      </div>
    </div>
  );
}
