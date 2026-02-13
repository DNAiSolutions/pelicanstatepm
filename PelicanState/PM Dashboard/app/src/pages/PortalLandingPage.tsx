import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContactPortalData } from '../hooks/useContactPortalData';

export function PortalLandingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const contactId = params.get('contactId');
  const portalData = useContactPortalData(contactId);
  const { projects, openWorkOrders, totalBudget, spentBudget, accountName, companyName, viewingMessage } = portalData;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Client Portal</p>
            <h1 className="text-2xl font-heading font-bold text-neutral-900">Welcome back, {accountName}</h1>
            <p className="text-sm text-neutral-600">{companyName}</p>
            {viewingMessage && <p className="text-xs text-emerald-600 mt-1">{viewingMessage}</p>}
          </div>
          <button
            onClick={() => navigate('/work-requests/new')}
            className="border border-neutral-300 text-neutral-700 px-4 py-2 text-sm"
          >
            New Work Order
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Active Projects</p>
            <p className="text-3xl font-heading font-bold text-neutral-900">{projects.length}</p>
            <p className="text-sm text-neutral-600">Across Wallace & partners</p>
          </div>
          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Open Work Orders</p>
            <p className="text-3xl font-heading font-bold text-neutral-900">{openWorkOrders.length}</p>
            <p className="text-sm text-neutral-600">In progress or awaiting review</p>
          </div>
          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Budget</p>
            <p className="text-3xl font-heading font-bold text-neutral-900">{formatCurrency(totalBudget - spentBudget)}</p>
            <p className="text-sm text-neutral-600">Remaining from {formatCurrency(totalBudget)}</p>
          </div>
        </section>

        <section className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading font-semibold text-neutral-900">Projects</h2>
              <p className="text-sm text-neutral-600">Overview of your active work</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="border border-neutral-200 p-4 space-y-2">
                <div className="flex items-center justify-between"><p className="font-semibold text-neutral-900">{project.name}</p><span className="text-xs text-neutral-500">{project.status}</span></div>
                <p className="text-sm text-neutral-600">{project.clientName}</p>
                <p className="text-xs text-neutral-500">Budget {formatCurrency(project.spentBudget)} / {formatCurrency(project.totalBudget)}</p>
                <button
                  className="text-sm text-[#143352]"
                  onClick={() => navigate(`/client-portal/projects/${project.id}${contactId ? `?contactId=${contactId}` : ''}`)}
                >
                  View project
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
