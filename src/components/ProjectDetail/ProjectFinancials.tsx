const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export interface ProjectFinancialsProps {
  project: any;
  onUpdate?: (project: any) => void;
}

export function ProjectFinancials({ project }: ProjectFinancialsProps) {
  const budgetProgress = Math.min(100, Math.round((project.spentBudget / project.totalBudget) * 100));

  return (
    <section className="space-y-6">
      {/* Budget Progress Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-5 space-y-2">
          <p className="text-sm font-semibold text-neutral-900">Client Info</p>
          <p className="font-semibold text-neutral-900">{project.clientName}</p>
          <p className="text-sm text-neutral-600">{project.clientEmail}</p>
          <p className="text-sm text-neutral-600">{project.clientPhone}</p>
          <p className="text-xs text-neutral-500">{project.clientSummary}</p>
        </div>

        <div className="bg-white border border-neutral-200 p-5 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-neutral-900 mb-3">Budget Progress</p>
          <div
            className="w-44 h-44 rounded-full flex items-center justify-center"
            style={{ background: `conic-gradient(#27AE60 0% ${budgetProgress}%, #E5E7EB ${budgetProgress}% 100%)` }}
          >
            <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center">
              <span className="text-4xl font-heading font-semibold text-neutral-900">{budgetProgress}%</span>
              <span className="text-xs text-neutral-500">Spend</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Cost Performance Index</p>
          {[60, 82, 43, 90].map((value, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-neutral-500">
              <span>Q{idx + 1}</span>
              <div className="flex-1 h-2 bg-neutral-100 rounded-full">
                <div className="h-full bg-[#0f2749] rounded-full" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget & Timeline Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 p-5 space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Budget & Timeline</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600">
            <div>
              <p className="text-xs uppercase text-neutral-500">Total Budget</p>
              <p className="text-lg font-semibold text-neutral-900">{formatCurrency(project.totalBudget)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">Spent</p>
              <p className="text-lg font-semibold text-neutral-900">{formatCurrency(project.spentBudget)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">Start</p>
              <p>{project.startDate}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">End</p>
              <p>{project.endDate}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-5 space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Safety Snapshot</p>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full" style={{ background: 'conic-gradient(#F04040 0% 25%, #F4B400 25% 55%, #27AE60 55% 100%)' }}>
              <div className="w-16 h-16 bg-white rounded-full mx-auto my-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-heading text-red-500">12</span>
                <span className="text-xs text-neutral-500">Alerts</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3 text-sm text-neutral-600">
              {[
                { label: 'Low Risk', value: 12 },
                { label: 'Medium', value: 23 },
                { label: 'Moderate', value: 2 },
                { label: 'High', value: 4 },
              ].map((item) => (
                <div key={item.label} className="border border-neutral-200 p-2 text-center">
                  <p className="text-xs text-neutral-500">{item.label}</p>
                  <p className="text-lg font-semibold text-neutral-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
