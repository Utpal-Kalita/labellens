import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Overview from './pages/Overview';
import Experiments from './pages/Experiments';
import ExperimentDetail from './pages/ExperimentDetail';
import SessionPage from './pages/Session';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

const navCls = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-primary text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`;

export default function App() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 bg-white border-r border-line p-4 flex flex-col">
        <div className="mb-6">
          <div className="text-lg font-semibold text-primary">LabelLens</div>
          <div className="text-xs text-slate-400">packaging research platform</div>
        </div>
        <nav className="space-y-1 flex-1">
          <NavLink to="/overview" className={navCls}>Overview</NavLink>
          <NavLink to="/experiments" className={navCls}>Experiments</NavLink>
          <NavLink to="/settings" className={navCls}>Settings</NavLink>
        </nav>
        <p className="text-[11px] text-slate-400 leading-snug">
          Not a medical device. Measurements are observational research data, stored locally on this machine.
        </p>
      </aside>
      <main className="flex-1 p-8 max-w-6xl">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/experiments/:id" element={<ExperimentDetail />} />
          <Route path="/experiments/:id/analytics" element={<Analytics />} />
          <Route path="/session/:experimentId" element={<SessionPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
