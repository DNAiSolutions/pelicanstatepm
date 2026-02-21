import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Sparkles } from 'lucide-react';

export function MainLayout() {
  const [assistOpen, setAssistOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar isCollapsed={false} />
      <main className="flex-1 bg-white p-10 overflow-auto">
        <Outlet />
      </main>
      <div className="fixed bottom-8 right-8 z-40">
        {assistOpen && (
          <div className="mb-3 w-72 bg-white border border-[var(--border-subtle)] rounded-3xl shadow-[0_20px_60px_rgba(15,31,51,0.12)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Pelican Assist</p>
                <p className="text-sm font-medium text-[var(--text-body)]">Need a hand?</p>
              </div>
              <button onClick={() => setAssistOpen(false)} className="text-[var(--text-muted)] text-xs">Close</button>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              I can help you triage late jobs, schedule visits, or prep a client update. Pick a row in Jobs or Quotes to get tailored tips.
            </p>
            <button className="mt-4 btn-secondary w-full text-sm" onClick={() => setAssistOpen(false)}>
              View suggestions
            </button>
          </div>
        )}
        <button
          onClick={() => setAssistOpen((prev) => !prev)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white shadow-[0_20px_45px_rgba(15,31,51,0.35)] flex items-center justify-center"
          aria-label="Open Pelican Assist"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
