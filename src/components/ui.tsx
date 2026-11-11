import React from 'react';

export function Button({ children, onClick, variant = 'primary', disabled, className = '', type = 'button' }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'accent' | 'ghost' | 'danger'; disabled?: boolean; className?: string; type?: 'button' | 'submit';
}) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-[#1e3a8a]',
    accent: 'bg-accent text-white hover:bg-[#1d4ed8]',
    ghost: 'bg-white text-ink border border-line hover:bg-slate-50',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-line p-5 ${className}`}>{children}</div>;
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-primary">{title}</h1>
      {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-line p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-primary mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'sim' }) {
  const styles = {
    neutral: 'bg-slate-100 text-slate-600',
    good: 'bg-green-100 text-green-700',
    warn: 'bg-amber-100 text-amber-700',
    sim: 'bg-violet-100 text-violet-700',
  }[tone];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>{children}</span>;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export const inputCls = 'w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 bg-white';
