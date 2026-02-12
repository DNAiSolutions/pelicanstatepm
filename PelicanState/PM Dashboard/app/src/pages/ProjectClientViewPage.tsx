import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { mockWorkOrders, mockContacts, type Project } from '../data/pipeline';
import { projectTaskService, type TaskTemplate } from '../services/projectTaskService';
import { leadService } from '../services/leadService';
import toast from 'react-hot-toast';

export function ProjectClientViewPage() {
  const { projectId, token } = useParams<{ projectId: string; token: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthorized'>('loading');
  const [requestForm, setRequestForm] = useState({ scope: '', location: '', contactName: '', email: '', phone: '', templateType: 'default' as TaskTemplate });
  const [submitting, setSubmitting] = useState(false);
  const templateLibrary = useMemo(() => projectTaskService.getTemplateLibrary(), []);
  const portalPlan = useMemo(
    () => projectTaskService.generateProjectPlan(requestForm.templateType, `${requestForm.scope} ${requestForm.location}`.trim()),
    [requestForm.templateType, requestForm.scope, requestForm.location]
  );

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

  const handlePortalRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    try {
      setSubmitting(true);
      await leadService.create({
        companyName: project.clientName,
        contactName: requestForm.contactName || project.clientName,
        email: requestForm.email || project.clientEmail,
        phone: requestForm.phone || project.clientPhone,
        stage: 'New',
        source: 'Client Portal',
        notes: `Portal request (${portalPlan.templateName}): ${requestForm.scope} ${requestForm.location}`,
        estimatedValue: 50000,
        campusId: project.campusId,
        projectId: undefined,
        contactIds: [],
      });
      setRequestForm({ scope: '', location: '', contactName: '', email: '', phone: '', templateType: requestForm.templateType });
      toast.success('Request submitted');
    } catch (error) {
      toast.error('Unable to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="bg-white border border-neutral-200 p-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Client Portal</p>
          <h1 className="text-3xl font-heading font-bold text-neutral-900">{project.name}</h1>
          <p className="text-sm text-neutral-600">Status: {project.status}</p>
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
            <p className="text-sm text-neutral-600">Need additional work? Submit a request and Pelican State will follow up.</p>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handlePortalRequest}>
            <select
              value={requestForm.templateType}
              onChange={(e) => setRequestForm({ ...requestForm, templateType: e.target.value as TaskTemplate })}
              className="border border-neutral-300 px-3 py-2 md:col-span-2"
            >
              {templateLibrary.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <textarea
              value={requestForm.scope}
              onChange={(e) => setRequestForm({ ...requestForm, scope: e.target.value })}
              required
              placeholder="Describe the work or location"
              className="border border-neutral-300 px-3 py-2 md:col-span-2"
              rows={3}
            />
            <input
              value={requestForm.location}
              onChange={(e) => setRequestForm({ ...requestForm, location: e.target.value })}
              placeholder="Site / address"
              className="border border-neutral-300 px-3 py-2 md:col-span-2"
            />
            <input
              value={requestForm.contactName}
              onChange={(e) => setRequestForm({ ...requestForm, contactName: e.target.value })}
              placeholder="Contact Name"
              className="border border-neutral-300 px-3 py-2"
            />
            <input
              value={requestForm.email}
              onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
              placeholder="Email"
              className="border border-neutral-300 px-3 py-2"
            />
            <input
              value={requestForm.phone}
              onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
              placeholder="Phone"
              className="border border-neutral-300 px-3 py-2"
            />
            {portalPlan && (
              <div className="md:col-span-2 bg-neutral-50 border border-neutral-200 p-4 text-sm text-neutral-600 space-y-2">
                <p className="font-medium text-neutral-900">Prep Questions</p>
                <ul className="list-disc list-inside space-y-1">
                  {portalPlan.questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
                <p className="text-neutral-600">Materials: {portalPlan.materials}</p>
                <p className="text-neutral-600">Labor: {portalPlan.labor}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#143352] text-white px-4 py-2 md:col-span-2 flex items-center justify-center"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
