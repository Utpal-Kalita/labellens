import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/ipc';
import type { Experiment, Packaging, Task } from '../lib/types';
import { Button, Card, PageTitle, Field, inputCls, Badge } from '../components/ui';

export default function ExperimentDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [exp, setExp] = useState<Experiment | null>(null);
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [defaults, setDefaults] = useState<any[]>([]);
  const [taskForm, setTaskForm] = useState({ title: '', instruction: '', expectedAnswer: '', answerType: 'short_text', options: '', timeLimitS: 60, packagingId: '' });

  const load = async () => {
    const d = await api.getExperiment(id);
    setExp(d.experiment); setPackaging(d.packaging); setTasks(d.tasks);
    const imgs: Record<string, string> = {};
    for (const p of d.packaging) { const data = await api.getPackagingImage(p.id); if (data) imgs[p.id] = data; }
    setImages(imgs);
  };
  useEffect(() => { load(); api.defaultTasks().then(setDefaults); }, [id]);

  const upload = async (file: File) => {
    const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
    const variantName = String.fromCharCode(65 + packaging.length); // A, B, C…
    await api.addPackaging({ experimentId: id, variantName, dataUrl });
    load();
  };

  const addTask = async () => {
    if (!taskForm.title.trim() || !taskForm.instruction.trim()) return;
    await api.addTask({
      experimentId: id, title: taskForm.title, instruction: taskForm.instruction,
      expectedAnswer: taskForm.expectedAnswer, answerType: taskForm.answerType,
      options: taskForm.options ? taskForm.options.split('\n').map(s => s.trim()).filter(Boolean) : [],
      timeLimitS: taskForm.timeLimitS, packagingId: taskForm.packagingId || null,
    });
    setTaskForm({ title: '', instruction: '', expectedAnswer: '', answerType: 'short_text', options: '', timeLimitS: 60, packagingId: '' });
    load();
  };

  if (!exp) return <div className="text-sm text-slate-500">Loading…</div>;
  const ready = packaging.length >= 2 && tasks.length >= 1;

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageTitle title={exp.name} sub={exp.objective || exp.description} />
        <div className="flex gap-2">
          <Link to={`/experiments/${id}/analytics`}><Button variant="ghost">Analytics</Button></Link>
          <Button variant="accent" disabled={!ready} onClick={() => nav(`/session/${id}`)}>
            {ready ? 'Start participant session' : 'Add 2+ designs and 1+ task first'}
          </Button>
        </div>
      </div>

      <h2 className="font-semibold text-primary mb-3">Packaging designs</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {packaging.map(p => (
          <Card key={p.id} className="p-3">
            {images[p.id] && <img src={images[p.id]} alt={`Variant ${p.variant_name}`} className="rounded-lg mb-2 aspect-[3/4] object-cover w-full" />}
            <div className="flex items-center justify-between">
              <Badge>Variant {p.variant_name}</Badge>
              <button className="text-xs text-red-500 hover:underline" onClick={() => api.deletePackaging(p.id).then(load)}>Remove</button>
            </div>
          </Card>
        ))}
        <label className="border-2 border-dashed border-line rounded-xl flex items-center justify-center text-sm text-slate-400 hover:border-accent hover:text-accent cursor-pointer min-h-[10rem] transition">
          + Upload design
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-primary">Research tasks</h2>
        <div className="flex gap-1 flex-wrap">
          {defaults.slice(0, 3).map((d, i) => (
            <button key={i} className="text-xs text-accent hover:underline"
              onClick={() => setTaskForm({ ...taskForm, title: d.title, instruction: d.instruction, answerType: d.answer_type, options: (d.options || []).join('\n') })}>
              + {d.title}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2 mb-6">
        {tasks.map(t => (
          <Card key={t.id} className="p-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">{t.title}</span>
              <span className="text-xs text-slate-500 ml-3">{t.instruction}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{t.answer_type.replace('_', ' ')}</Badge>
              <button className="text-xs text-red-500 hover:underline" onClick={() => api.deleteTask(t.id).then(load)}>Delete</button>
            </div>
          </Card>
        ))}
        {!tasks.length && <Card className="text-sm text-slate-500">No tasks yet.</Card>}
      </div>

      <Card>
        <h3 className="font-medium text-primary mb-4">Add a task</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Task title"><input className={inputCls} value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Allergen identification" /></Field>
          <Field label="Answer type">
            <select className={inputCls} value={taskForm.answerType} onChange={e => setTaskForm({ ...taskForm, answerType: e.target.value })}>
              <option value="short_text">Short text</option>
              <option value="multiple_choice">Multiple choice</option>
              <option value="numeric">Numeric</option>
            </select>
          </Field>
        </div>
        <Field label="Instruction shown to the participant"><input className={inputCls} value={taskForm.instruction} onChange={e => setTaskForm({ ...taskForm, instruction: e.target.value })} placeholder="Find whether the product contains peanuts." /></Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Expected answer (optional)" hint="Used to score accuracy; leave blank to review manually"><input className={inputCls} value={taskForm.expectedAnswer} onChange={e => setTaskForm({ ...taskForm, expectedAnswer: e.target.value })} /></Field>
          <Field label="Time limit (s)"><input className={inputCls} type="number" min={5} value={taskForm.timeLimitS} onChange={e => setTaskForm({ ...taskForm, timeLimitS: +e.target.value })} /></Field>
          <Field label="Limit to variant (optional)">
            <select className={inputCls} value={taskForm.packagingId} onChange={e => setTaskForm({ ...taskForm, packagingId: e.target.value })}>
              <option value="">All variants</option>
              {packaging.map(p => <option key={p.id} value={p.id}>Variant {p.variant_name}</option>)}
            </select>
          </Field>
        </div>
        {taskForm.answerType === 'multiple_choice' && (
          <Field label="Options (one per line)"><textarea className={inputCls} rows={3} value={taskForm.options} onChange={e => setTaskForm({ ...taskForm, options: e.target.value })} /></Field>
        )}
        <Button variant="primary" onClick={addTask} disabled={!taskForm.title.trim() || !taskForm.instruction.trim()}>Add task</Button>
      </Card>
    </div>
  );
}
