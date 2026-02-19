import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  onNewIntakeClick: () => void;
  onNewWorkRequestClick: () => void;
}

export function DashboardHeader({ onNewIntakeClick, onNewWorkRequestClick }: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500 mb-2">Welcome back</p>
        <h1 className="text-4xl font-heading font-bold text-neutral-900 mb-2">Dashboard</h1>
        <p className="text-neutral-600">Overview of your projects, work requests, and upcoming tasks</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onNewIntakeClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#143352] text-white hover:bg-[#143352]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Intake
        </button>
        <button
          onClick={onNewWorkRequestClick}
          className="flex items-center gap-2 px-4 py-2 border border-[#143352] text-[#143352] hover:bg-[#143352]/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Work Request
        </button>
      </div>
    </div>
  );
}
