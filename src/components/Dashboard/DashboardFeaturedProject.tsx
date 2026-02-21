import { type Project } from '../../data/pipeline';
import { getPropertyById } from '../../data/pipeline';

interface DashboardFeaturedProjectProps {
  project: Project;
  metrics: {
    budgetUsedPercent: number;
    timelinePercent: number;
  };
  onViewProjectClick: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function DashboardFeaturedProject({
  project,
  metrics,
  onViewProjectClick,
}: DashboardFeaturedProjectProps) {
  const property = project.propertyId ? getPropertyById(project.propertyId) : null;

  return (
    <div className="bg-white border border-neutral-200 p-6 rounded-lg lg:col-span-2">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold text-neutral-900 mb-1">
            {project.name}
          </h2>
          <p className="text-sm text-neutral-500">
            {property?.name} • {project.clientName}
          </p>
        </div>
        <button
          onClick={onViewProjectClick}
          className="text-sm text-[#0f2749] hover:text-[#0f2749]/80 font-medium"
        >
          View Project →
        </button>
      </div>

      {/* Timeline Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-neutral-900">Timeline Progress</p>
          <p className="text-sm text-neutral-500">{metrics.timelinePercent}%</p>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#0f2749] h-full transition-all"
            style={{ width: `${metrics.timelinePercent}%` }}
          />
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Start: {project.startDate} • End: {project.endDate}
        </p>
      </div>

      {/* Budget Status */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs uppercase text-neutral-500 mb-1">Total Budget</p>
          <p className="text-lg font-bold text-neutral-900">{formatCurrency(project.totalBudget)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-neutral-500 mb-1">Spent</p>
          <p className="text-lg font-bold text-neutral-900">{formatCurrency(project.spentBudget)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-neutral-500 mb-1">Budget Used</p>
          <p className="text-lg font-bold text-neutral-900">{metrics.budgetUsedPercent}%</p>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="mt-4">
        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all ${
              metrics.budgetUsedPercent > 90 ? 'bg-red-500' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, metrics.budgetUsedPercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
