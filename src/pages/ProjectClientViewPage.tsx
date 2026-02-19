import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { mockWorkOrders, mockContacts, type Project } from '../data/pipeline';
import toast from 'react-hot-toast';
import { LeadIntakeModal } from '../components/leads/LeadIntakeModal';

export function ProjectClientViewPage() {
  const { projectId, token } = useParams<{ projectId: string; token: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthorized'>('loading');
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  useEffect(() => {
    async function load() {
      if (!projectId) {
        setStatus('unauthorized');
        return;
      }
      const proj = await projectService.getProject(projectId);
      if (!proj || (proj.shareToken && proj.shareToken !== token)) {
        setStatus('unauthorized');
        return;
      }
      setProject(proj);
      setStatus('ready');
    }
    load();
  }, [projectId, token]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-10 h-10 border-4 border-[#143352]/20 border-t-[#143352] rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'unauthorized' || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="bg-white border border-neutral-200 p-6 text-center space-y-2">
          <p className="text-lg font-heading font-semibold text-neutral-900">Link unavailable</p>
          <p className="text-neutral-600 text-sm">Please contact Pelican State for a new client portal link.</p>
        </div>
      </div>
    );
  }

  const workOrders = mockWorkOrders.filter((wo) => wo.projectId === project.id);
  const contacts = mockContacts.filter((contact) => contact.projectIds.includes(project.id)).slice(0, 3);

  return (
    <div className="min-h-screen bg-neutral-50 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="bg-white border border-neutral-200 p-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Client Portal</p>
          <h1 className="text-3xl font-heading font-bold text-neutral-900">{project.name}</h1>
          <p className="text-sm text-neutral-600">Status: {project.status}</p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowIntakeModal(true)}
              className="inline-flex items-center gap-2 border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
            >
              New Intake
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.clientVisibility.showBudget && (
            <div className="bg-white border border-neutral-200 p-5">
              <p className="text-xs text-neutral-500 uppercase">Budget</p>
              <p className="text-2xl font-bold text-neutral-900">{formatCurrency(project.totalBudget)}</p>
              <p className="text-sm text-neutral-600">Spent {formatCurrency(project.spentBudget)}</p>
            </div>
          )}
          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-xs text-neutral-500 uppercase">Timeline</p>
            <p className="text-sm text-neutral-900">{project.startDate} – {project.endDate}</p>
          </div>
        </section>

        {project.clientVisibility.showTimeline && (
          <section className="bg-white border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-semibold text-neutral-900">Work Orders</h2>
              <p className="text-sm text-neutral-500">{workOrders.length} open</p>
            </div>
            {workOrders.length === 0 ? (
              <p className="text-sm text-neutral-500">No work orders yet.</p>
            ) : (
              <div className="space-y-3">
                {workOrders.map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between border border-neutral-100 p-3">
                    <div>
                      <p className="font-medium text-neutral-900">{wo.title}</p>
                      <p className="text-xs text-neutral-500">{wo.status}</p>
                    </div>
                    <p className="text-sm text-neutral-600">{wo.percentComplete}%</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {project.clientVisibility.showContacts && contacts.length > 0 && (
          <section className="bg-white border border-neutral-200 p-5">
            <h2 className="text-lg font-heading font-semibold text-neutral-900 mb-4">Key Contacts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="border border-neutral-100 p-3 text-sm">
                  <p className="font-medium text-neutral-900">{contact.name}</p>
                  <p className="text-neutral-500">{contact.title}</p>
                  <p className="text-neutral-600 mt-2">{contact.email}</p>
                  <p className="text-neutral-600">{contact.phone}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white border border-neutral-200 p-5 space-y-4">
          <div>
            <h2 className="text-lg font-heading font-semibold text-neutral-900">Request New Project</h2>
            <p className="text-sm text-neutral-600">Need additional work? Use the intake form to share what you need.</p>
          </div>
          <button
            onClick={() => setShowIntakeModal(true)}
            className="bg-[#143352] text-white px-4 py-2 text-sm font-medium"
          >
            Open Intake Form
          </button>
        </section>
      </div>

      {project && showIntakeModal && (
        <LeadIntakeModal
          open={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          mode="client"
          defaultCompany={project.clientName}
          defaultContact={{ name: project.clientName, email: project.clientEmail, phone: project.clientPhone }}
          defaultCampusId={project.campusId}
          defaultProjectId={project.id}
          onCreated={() => toast.success('Request submitted')}
        />
      )}
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
