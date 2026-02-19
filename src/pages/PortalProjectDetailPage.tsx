import { useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { mockContacts } from '../data/pipeline';
import { useContactPortalData } from '../hooks/useContactPortalData';

export function PortalProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const contactId = params.get('contactId');
  const portalData = useContactPortalData(contactId);
  const { projects, workOrders, accountName, companyName, viewingMessage } = portalData;
  const project = projects.find((item) => item.id === projectId);
  const projectWorkOrders = useMemo(() => workOrders.filter((wo) => wo.projectId === project?.id), [workOrders, project]);
  const contacts = useMemo(() => mockContacts.filter((contact) => contact.projectIds.includes(project?.id ?? '')), [project]);
  const overallProgress = useMemo(() => {
    if (!projectWorkOrders.length) return 0;
    const total = projectWorkOrders.reduce((sum, wo) => sum + wo.percentComplete, 0);
    return Math.round(total / projectWorkOrders.length);
  }, [projectWorkOrders]);
  const materials = useMemo(
    () =>
      projectWorkOrders.flatMap((wo) =>
        (wo.materials || []).map((material) => ({
          ...material,
          source: wo.title,
        }))
      ),
    [projectWorkOrders]
  );

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="bg-white p-6 border border-neutral-200 text-center space-y-2">
          <p className="font-heading font-semibold text-neutral-900">Project not found</p>
          <Link to="/client-portal/projects" className="text-[#143352] text-sm">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Client Portal</p>
            <h1 className="text-3xl font-heading font-bold text-neutral-900">{project.name}</h1>
            <p className="text-sm text-neutral-600">Budget {formatCurrency(project.spentBudget)} / {formatCurrency(project.totalBudget)}</p>
            <p className="text-xs text-neutral-500">{companyName} • Contact: {accountName}</p>
            {viewingMessage && <p className="text-xs text-emerald-600">{viewingMessage}</p>}
            <Link to={`/client-portal/projects${contactId ? `?contactId=${contactId}` : ''}`} className="text-xs text-[#143352] underline">
              ← Back to projects
            </Link>
          </div>
          <button className="border border-neutral-300 text-neutral-700 px-4 py-2 text-sm" onClick={() => navigate('/work-requests/new')}>
            New Work Order
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard label="Schedule" value={`${project.startDate} – ${project.endDate}`} />
          <InfoCard label="Status" value={project.status} />
          <InfoCard label="Client Contact" value={project.clientName} />
        </section>

        <section className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Overall Progress</p>
              <p className="text-2xl font-heading font-semibold text-neutral-900">{overallProgress}% complete</p>
            </div>
            <p className="text-sm text-neutral-500">Based on active work orders</p>
          </div>
          <div className="h-3 bg-neutral-100">
            <div className="h-full bg-[#143352]" style={{ width: `${overallProgress}%` }} />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard label="Spent to Date" value={formatCurrency(project.spentBudget)} />
          <InfoCard label="Budget Remaining" value={formatCurrency(project.totalBudget - project.spentBudget)} />
        </section>

        <section className="bg-white border border-neutral-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-neutral-900">Work Orders</h2>
            <p className="text-sm text-neutral-500">{projectWorkOrders.length} total</p>
          </div>
          {projectWorkOrders.length === 0 ? (
            <p className="text-sm text-neutral-500">No work orders yet.</p>
          ) : (
            <div className="space-y-3">
              {projectWorkOrders.map((wo) => (
                <div key={wo.id} className="border border-neutral-200 p-4 text-sm">
                  <p className="font-semibold text-neutral-900">{wo.title}</p>
                  <p className="text-neutral-500">Status: {wo.status}</p>
                  <p className="text-neutral-500">Percent Complete: {wo.percentComplete}%</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-neutral-200 p-6 space-y-3">
          <h2 className="text-lg font-heading font-semibold text-neutral-900">Key Contacts</h2>
          {contacts.length === 0 ? (
            <p className="text-sm text-neutral-500">No contacts available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="border border-neutral-200 p-3 text-sm">
                  <p className="font-medium text-neutral-900">{contact.name}</p>
                  <p className="text-neutral-500">{contact.title}</p>
                  <p className="text-neutral-600 mt-2">{contact.email}</p>
                  <p className="text-neutral-600">{contact.phone}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-neutral-200 p-6 space-y-3">
          <h2 className="text-lg font-heading font-semibold text-neutral-900">Materials</h2>
          {materials.length === 0 ? (
            <p className="text-sm text-neutral-500">Materials usage will appear here as work orders progress.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  <tr>
                    <th className="text-left py-2">Material</th>
                    <th className="text-left py-2">Qty</th>
                    <th className="text-left py-2">Work Order</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material, index) => (
                    <tr key={`${material.name}-${index}`} className="border-t border-neutral-100">
                      <td className="py-2 text-neutral-900">{material.name}</td>
                      <td className="py-2 text-neutral-600">{material.quantity} {material.unit}</td>
                      <td className="py-2 text-neutral-500">{material.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-neutral-200 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{label}</p>
      <p className="text-sm text-neutral-800">{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
