import { useEffect, useMemo, useState } from 'react';
import { contactService } from '../services/contactService';
import {
  mockLeads,
  mockLeadIntakeRecords,
  mockWalkthroughSessions,
  type Contact,
} from '../data/pipeline';
import { Plus, Search, Filter, Phone, Mail, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContactPortalData } from '../hooks/useContactPortalData';
import { useProfileData } from '../hooks/useProfileData';
import toast from 'react-hot-toast';

export function ContactsPage() {
  const { isAdminProfile, campuses } = useProfileData();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Contact['type'] | ''>('');
  const [campusFilter, setCampusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    type: 'Client' as Contact['type'],
    campusId: campuses[0]?.id || '',
  });
  const [portalAccess, setPortalAccess] = useState<Record<string, boolean>>({});
  const [selectedPortalContact, setSelectedPortalContact] = useState<Contact | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Admin profile: always empty, no mock data
        if (isAdminProfile) {
          setContacts([]);
          return;
        }
        const data = await contactService.list();
        setContacts(data);
      } catch (error) {
        toast.error('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdminProfile]);

  useEffect(() => {
    const map: Record<string, boolean> = {};
    contacts.forEach((contact) => {
      map[contact.id] = contact.clientPortalEnabled ?? false;
    });
    setPortalAccess(map);
  }, [contacts]);

  const filtered = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        contact.name.toLowerCase().includes(search.toLowerCase()) ||
        contact.company.toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || contact.type === typeFilter;
      const matchesCampus = !campusFilter || contact.campusId === campusFilter;
      return matchesSearch && matchesType && matchesCampus;
    });
  }, [contacts, search, typeFilter, campusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const contact = await contactService.create({
        ...form,
        company: 'Pelican State',
        projectIds: [],
        leadIds: [],
        preferredChannel: 'Email',
        notes: 'Added via contacts page',
      });
      setContacts((prev) => [...prev, contact]);
      setForm({ name: '', title: '', email: '', phone: '', type: 'Client', campusId: campuses[0]?.id || '' });
      toast.success('Contact added');
    } catch (error) {
      toast.error('Failed to add contact');
    }
  };

  const handleTogglePortalAccess = async (contactId: string, enabled: boolean) => {
    setPortalAccess((prev) => ({ ...prev, [contactId]: enabled }));
    setContacts((prev) => prev.map((contact) => (contact.id === contactId ? { ...contact, clientPortalEnabled: enabled } : contact)));
    if (!enabled && selectedPortalContact?.id === contactId) {
      setSelectedPortalContact(null);
    }
    try {
      await contactService.update(contactId, { clientPortalEnabled: enabled });
      toast.success(enabled ? 'Client portal access enabled' : 'Client portal access disabled');
    } catch (error) {
      toast.error('Failed to update portal access');
    }
  };

  const handleOpenPortalPreview = (contact: Contact) => {
    setSelectedPortalContact(contact);
  };

  const handleClosePortalPreview = () => setSelectedPortalContact(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#143352]/20 border-t-[#143352] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Network</p>
          <h1 className="text-3xl font-heading font-bold text-neutral-900">Contacts</h1>
        </div>
        <button
          onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="inline-flex items-center gap-2 bg-[#143352] text-white px-4 py-2.5 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </header>

      <section className="bg-white border border-neutral-200 p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-neutral-600 text-sm">
          <Filter className="w-4 h-4" /> Search and filter your stakeholders
        </div>
        <div className="flex flex-col gap-3 w-full lg:w-auto lg:flex-row">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts"
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#143352]"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as Contact['type'] | '')} className="px-3 py-2 border border-neutral-300">
            <option value="">All Types</option>
            {['Client', 'Internal', 'Vendor', 'Partner'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} className="px-3 py-2 border border-neutral-300">
            <option value="">All Campuses</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Company</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Campus</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Portal</th>
                <th className="text-left py-3 px-4">Intakes</th>
                <th className="text-left py-3 px-4">Walkthroughs</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-neutral-500">No contacts found.</td>
                </tr>
              ) : (
                filtered.map((contact) => {
                  const associatedLeads = mockLeads.filter((lead) => contact.leadIds.includes(lead.id));
                  const intakeHistory = mockLeadIntakeRecords
                    .filter((record) => associatedLeads.some((lead) => lead.id === record.leadId))
                    .sort((a, b) => new Date(b.capturedAt).valueOf() - new Date(a.capturedAt).valueOf());
                  const walkthroughHistory = mockWalkthroughSessions
                    .filter((session) => contact.leadIds.includes(session.leadId))
                    .sort((a, b) => new Date(b.scheduledDate).valueOf() - new Date(a.scheduledDate).valueOf());
                  const latestIntake = intakeHistory[0];
                  const latestWalkthrough = walkthroughHistory[0];
                  const portalEnabled = portalAccess[contact.id] ?? false;
                  const portalPath = portalEnabled ? getPortalPath(contact) : null;
                  return (
                    <tr key={contact.id} className="border-t border-neutral-100">
                      <td className="py-2 px-4">
                        <p className="font-semibold text-neutral-900">{contact.name}</p>
                        <p className="text-xs text-neutral-500">{contact.title}</p>
                      </td>
                      <td className="py-2 px-4 text-neutral-700">{contact.company}</td>
                      <td className="py-2 px-4 text-neutral-700">{contact.type}</td>
                      <td className="py-2 px-4 text-neutral-700">{campuses.find((c) => c.id === contact.campusId)?.name || 'Multiple'}</td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2 text-neutral-700">
                          <Mail className="w-4 h-4 text-neutral-400" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2 text-neutral-700">
                          <Phone className="w-4 h-4 text-neutral-400" />
                          <span>{contact.phone}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {contact.type !== 'Client' ? (
                          <span className="inline-flex items-center gap-2 text-xs text-neutral-400 border border-neutral-200 px-2.5 py-1 rounded-full" title="Portal access reserved for client contacts">
                            <ExternalLink className="w-3 h-3" /> Portal NA
                          </span>
                        ) : portalEnabled && portalPath ? (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleOpenPortalPreview(contact)}
                              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-white bg-[#143352] px-3 py-1.5 rounded-full"
                            >
                              Preview Portal
                            </button>
                            <Link
                              to={portalPath}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-semibold text-[#143352] border border-[#143352]/30 px-2.5 py-1.5 rounded-full hover:bg-[#143352]/5"
                            >
                              <ExternalLink className="w-3 h-3" /> Open Full Portal
                            </Link>
                            <button
                              onClick={() => handleTogglePortalAccess(contact.id, false)}
                              className="text-[11px] text-neutral-500 underline"
                            >
                              Disable access
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleTogglePortalAccess(contact.id, true)}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-[#143352] border border-dashed border-[#143352]/50 px-2.5 py-1.5 rounded-full hover:bg-[#143352]/5"
                          >
                            Enable Portal
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-4 text-neutral-700">
                        {intakeHistory.length}
                        {latestIntake && (
                          <p className="text-xs text-neutral-500">
                            {new Date(latestIntake.capturedAt).toLocaleDateString()} · {latestIntake.formSnapshot.intakeChannel}
                          </p>
                        )}
                      </td>
                      <td className="py-2 px-4 text-neutral-700">
                        {walkthroughHistory.length}
                        {latestWalkthrough && (
                          <p className="text-xs text-neutral-500 flex items-center gap-2">
                            {new Date(latestWalkthrough.scheduledDate).toLocaleDateString()}
                            <Link to={`/walkthroughs/new/${latestWalkthrough.leadId}`} className="text-[#143352]">
                              View
                            </Link>
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section id="contact-form" className="bg-white border border-neutral-200 p-6 space-y-4">
        <h2 className="text-lg font-heading font-semibold text-neutral-900">Create Contact</h2>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleCreate}>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="border border-neutral-300 px-3 py-2" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Contact['type'] })} className="border border-neutral-300 px-3 py-2">
            {['Client', 'Internal', 'Vendor', 'Partner'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select value={form.campusId} onChange={(e) => setForm({ ...form, campusId: e.target.value })} className="border border-neutral-300 px-3 py-2">
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
          <button type="submit" className="bg-[#143352] text-white px-4 py-2 font-medium flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Save Contact
          </button>
        </form>
      </section>
      </div>
      {selectedPortalContact && (
        <ContactPortalDrawer
          contact={selectedPortalContact}
          portalPath={getPortalPath(selectedPortalContact) ?? '/client-portal'}
          onClose={handleClosePortalPreview}
          onDisable={() => handleTogglePortalAccess(selectedPortalContact.id, false)}
        />
      )}
    </>
  );
}

function ContactPortalDrawer({ contact, portalPath, onClose, onDisable }: { contact: Contact; portalPath: string; onClose: () => void; onDisable: () => void }) {
  const portalData = useContactPortalData(contact.id);
  const { projects, workOrders, openWorkOrders, totalBudget, spentBudget } = portalData;
  const summaryCards = [
    { label: 'Active Projects', value: projects.length.toString() },
    { label: 'Open Work Orders', value: openWorkOrders.length.toString() },
    { label: 'Budget Remaining', value: formatCurrency(Math.max(totalBudget - spentBudget, 0)) },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-end">
      <div className="bg-white w-full max-w-5xl h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Client Portal Preview</p>
            <h2 className="text-2xl font-heading font-semibold text-neutral-900">{contact.name}</h2>
            <p className="text-sm text-neutral-600">{contact.company} • {contact.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={portalPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-neutral-300 rounded-full text-neutral-700"
            >
              <ExternalLink className="w-4 h-4" /> Open Portal
            </Link>
            <button onClick={onDisable} className="text-xs text-neutral-500 underline">Disable Access</button>
            <button onClick={onClose} className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 bg-neutral-50">
            <div className="grid gap-4 md:grid-cols-3">
              {summaryCards.map((card) => (
                <div key={card.label} className="bg-white border border-neutral-200 p-4 rounded-2xl">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{card.label}</p>
                  <p className="text-2xl font-heading font-semibold text-neutral-900">{card.value}</p>
                </div>
              ))}
            </div>
            {portalData.viewingMessage && (
              <div className="bg-white border border-neutral-200 p-4 rounded-2xl text-xs text-neutral-600">
                {portalData.viewingMessage}
              </div>
            )}
          <section className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-heading font-semibold text-neutral-900">Projects ({projects.length})</h3>
                <p className="text-xs text-neutral-500">Aggregated view limited to this contact’s work</p>
              </div>
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-neutral-500">No projects assigned yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {projects.map((project) => (
                  <div key={project.id} className="border border-neutral-200 rounded-xl p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-neutral-900">{project.name}</p>
                      <span className="text-xs text-neutral-500">{project.status}</span>
                    </div>
                    <p className="text-xs text-neutral-500">{project.clientSummary}</p>
                    <p className="text-xs text-neutral-500">Budget {formatCurrency(project.spentBudget)} / {formatCurrency(project.totalBudget)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-heading font-semibold text-neutral-900">Work Orders ({workOrders.length})</h3>
                <p className="text-xs text-neutral-500">Mirrors what the client sees inside the portal</p>
              </div>
            </div>
            {workOrders.length === 0 ? (
              <p className="text-sm text-neutral-500">No work orders have been published to this contact yet.</p>
            ) : (
              <div className="space-y-3">
                {workOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium text-neutral-900">{order.title}</p>
                      <span className="text-xs px-2 py-1 border border-neutral-200 rounded-full text-neutral-600">{order.status}</span>
                    </div>
                    <p className="text-xs text-neutral-500">{order.category} • {order.priority} priority</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function getPortalPath(contact: Contact): string | null {
  if (contact.type !== 'Client') return null;
  const primaryProjectId = contact.projectIds?.[0];
  if (primaryProjectId) {
    return `/client-portal/projects/${primaryProjectId}?contactId=${contact.id}`;
  }
  return `/client-portal/projects?contactId=${contact.id}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
