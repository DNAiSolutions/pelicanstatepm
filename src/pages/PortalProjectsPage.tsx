import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useContactPortalData } from '../hooks/useContactPortalData';

export function PortalProjectsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const contactId = params.get('contactId');
  const portalData = useContactPortalData(contactId);
  const { projects, accountName, companyName, viewingMessage } = portalData;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Client Portal</p>
            <h1 className="text-2xl font-heading font-bold text-neutral-900">Projects for {accountName}</h1>
            <p className="text-xs text-neutral-500">{companyName}</p>
            {viewingMessage && <p className="text-xs text-emerald-600 mt-1">{viewingMessage}</p>}
            <Link to={`/client-portal${contactId ? `?contactId=${contactId}` : ''}`} className="text-xs text-[#0f2749] underline">← Back to overview</Link>
          </div>
          <button className="border border-neutral-300 text-neutral-700 px-4 py-2 text-sm" onClick={() => navigate('/work-requests/new')}>
            New Work Order
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-4">
        {projects.map((project) => {
          const projectLink = `/client-portal/projects/${project.id}${contactId ? `?contactId=${contactId}` : ''}`;
          return (
            <div key={project.id} className="bg-white border border-neutral-200 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-heading font-semibold text-neutral-900">{project.name}</h2>
                <p className="text-sm text-neutral-600">{project.clientName}</p>
                <p className="text-xs text-neutral-500">Status {project.status}</p>
              </div>
              <div className="text-sm text-neutral-500">
                <p>Budget {formatCurrency(project.spentBudget)} / {formatCurrency(project.totalBudget)}</p>
                <p>Schedule {project.startDate} – {project.endDate}</p>
              </div>
              <Link to={projectLink} className="text-[#0f2749] text-sm">
                View project
              </Link>
            </div>
          );
        })}
      </main>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
