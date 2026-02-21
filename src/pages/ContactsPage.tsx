import { useEffect, useMemo, useState } from 'react';
import { contactService } from '../services/contactService';
import { mockLeads } from '../data/pipeline';
import type { Contact } from '../types';
import { Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProfileData } from '../hooks/useProfileData';
import { formatDistanceToNow } from 'date-fns';

const STATUS_BADGES: Record<'Lead' | 'Active', string> = {
  Lead: 'bg-sky-50 text-sky-700 border border-sky-200',
  Active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

type CommunicationPrefs = {
  quoteFollowUps: boolean;
  invoiceFollowUps: boolean;
  visitReminders: boolean;
  jobClosureFollowUps: boolean;
};

type ClientFormState = {
  title: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  email: string;
  leadSource: string;
  propertyId: string;
  address: {
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  billingSameAsProperty: boolean;
  communicationPreferences: CommunicationPrefs;
};

const DEFAULT_PREFS: CommunicationPrefs = {
  quoteFollowUps: true,
  invoiceFollowUps: true,
  visitReminders: true,
  jobClosureFollowUps: true,
};

const buildInitialForm = (propertyId: string): ClientFormState => ({
  title: 'No title',
  firstName: '',
  lastName: '',
  company: '',
  phone: '',
  email: '',
  leadSource: '',
  propertyId,
  address: {
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  },
  billingSameAsProperty: true,
  communicationPreferences: { ...DEFAULT_PREFS },
});

export function ContactsPage() {
  const { properties } = useProfileData();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lead' | 'active'>('all');
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCommunicationSettings, setShowCommunicationSettings] = useState(false);
  const [form, setForm] = useState<ClientFormState>(() => buildInitialForm(properties[0]?.id || ''));

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await contactService.list();
        setContacts(data);
      } catch (error) {
        toast.error('Failed to load clients');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    setForm((prev) => ({ ...prev, propertyId: prev.propertyId || properties[0]?.id || '' }));
  }, [properties]);

  const clients = useMemo(() => contacts.filter((contact) => contact.type === 'Client'), [contacts]);
  const propertyMap = useMemo(() => {
    const map = new Map<string, { name: string; address?: string }>();
    properties.forEach((property) => map.set(property.id, property));
    return map;
  }, [properties]);

  const thirtyDaysAgo = useMemo(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), []);
  const startOfYear = useMemo(() => new Date(new Date().getFullYear(), 0, 1), []);

  const stats = useMemo(() => {
    const newLeads = mockLeads.filter((lead: any) => new Date(lead.createdAt) >= thirtyDaysAgo).length;
    const newClients = clients.filter((client) => new Date(client.created_at) >= thirtyDaysAgo).length;
    const totalNewClients = clients.filter((client) => new Date(client.created_at) >= startOfYear).length;
    return [
      { label: 'New leads (30 days)', value: newLeads, trend: '+100%' },
      { label: 'New clients (30 days)', value: newClients, trend: '+100%' },
      { label: 'Total new clients (YTD)', value: totalNewClients, trend: '+100%' },
    ];
  }, [clients, thirtyDaysAgo, startOfYear]);

  const filtered = useMemo(() => {
    return clients.filter((contact) => {
      const matchesSearch =
        contact.name.toLowerCase().includes(search.toLowerCase()) ||
        contact.company.toLowerCase().includes(search.toLowerCase());
      const status = getClientStatus(contact);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'lead' && status === 'Lead') ||
        (statusFilter === 'active' && status === 'Active');
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  const resetForm = () => setForm(buildInitialForm(properties[0]?.id || ''));

  const handleCreate = async (
    event: React.FormEvent<HTMLFormElement>,
    options?: { keepOpen?: boolean }
  ) => {
    event.preventDefault();
    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim() || form.company || 'New Client';
      const contact = await contactService.create({
        name: fullName,
        title: form.title,
        email: form.email,
        phone: form.phone,
        type: 'Client',
        property_id: form.propertyId,
        company: form.company || fullName,
        preferred_channel: 'Email',
        notes: `Lead source: ${form.leadSource || 'N/A'} | Address: ${[
          form.address.street1,
          form.address.city,
          form.address.state,
          form.address.zip,
        ]
          .filter(Boolean)
          .join(', ')} | Billing same as property: ${form.billingSameAsProperty ? 'Yes' : 'No'}`,
      });
      setContacts((prev) => [...prev, contact]);
      if (options?.keepOpen) {
        resetForm();
      } else {
        setShowFormModal(false);
        resetForm();
      }
      toast.success('Client added');
    } catch (error) {
      toast.error('Failed to add client');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Clients</p>
          <h1 className="text-3xl font-heading font-semibold text-[var(--text-body)]">Clients</h1>
        </div>
        <button onClick={() => setShowFormModal(true)} className="btn-primary px-6 py-2 text-sm">
          <Plus className="w-4 h-4" /> New Client
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((card) => (
          <div key={card.label} className="bg-white border border-[var(--border-subtle)] rounded-3xl p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">{card.label}</p>
            <div className="flex items-baseline gap-3 mt-2">
              <p className="text-3xl font-heading text-[var(--text-body)]">{card.value}</p>
              <span className="text-xs text-emerald-600 font-semibold">{card.trend}</span>
            </div>
          </div>
        ))}
        <div className="bg-white border border-[var(--border-subtle)] rounded-3xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Integrations</p>
            <h3 className="text-lg font-heading text-[var(--text-body)] mt-1">Sync clients with QuickBooks Online</h3>
            <p className="text-sm text-[var(--text-muted)] mt-2">Eliminate double entry by keeping your CRM and accounting data aligned.</p>
          </div>
          <button className="btn-secondary mt-4 w-max px-4 py-2 text-sm">Sync now</button>
        </div>
      </section>

      <section className="bg-white border border-[var(--border-subtle)] rounded-3xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
          <button className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm">
            <Filter className="w-4 h-4" /> Filter by tag
          </button>
          {[
            { label: 'Status', value: 'all' },
            { label: 'Leads', value: 'lead' },
            { label: 'Active', value: 'active' },
          ].map((chip) => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value as 'all' | 'lead' | 'active')}
              className={`px-4 py-2 border text-sm ${
                statusFilter === chip.value
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                  : 'text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              {chip.label}
            </button>
          ))}
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients"
              className="w-full pl-11 pr-4 py-2 border rounded-full"
            />
          </div>
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Filtered clients ({filtered.length} results)</p>
      </section>

      <section className="bg-white border border-[var(--border-subtle)] rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--brand-sand)] text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Address</th>
                <th className="text-left px-6 py-3">Tags</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No clients found with the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((contact) => {
                  const property = contact.property_id ? propertyMap.get(contact.property_id) : undefined;
                  const status = getClientStatus(contact);
                  const tags = contact.project_ids.length > 1
                    ? `${contact.project_ids.length} properties`
                    : property?.name || 'Single property';
                  return (
                    <tr key={contact.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--brand-sand)]/70">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[var(--text-body)]">{contact.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{contact.company}</p>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)]">{property?.address || tags}</td>
                      <td className="px-6 py-4 text-[var(--text-muted)]">
                        <span className="inline-flex items-center px-3 py-1 border border-[var(--border-subtle)] rounded-full text-xs">
                          {tags}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${STATUS_BADGES[status]}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)]">{formatLastActivity(contact.updated_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl border border-[var(--border-subtle)] shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">New client</p>
                <h2 className="text-2xl font-heading font-semibold text-[var(--text-body)]">Primary contact details</h2>
                <p className="text-sm text-[var(--text-muted)]">Provide the main point of contact for smooth communication.</p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
            </div>
            <form className="space-y-6" onSubmit={(e) => handleCreate(e)}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border rounded-2xl px-3 py-2">
                  {['No title', 'Ms.', 'Mr.', 'Mx.', 'Dr.'].map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" className="border rounded-2xl px-3 py-2" />
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" className="border rounded-2xl px-3 py-2" />
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" className="border rounded-2xl px-3 py-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" className="border rounded-2xl px-3 py-2" />
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border rounded-2xl px-3 py-2" />
              </div>
              <button type="button" onClick={() => setShowCommunicationSettings(true)} className="text-sm text-[var(--brand-primary)] underline">
                Communication settings
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input value={form.leadSource} onChange={(e) => setForm({ ...form, leadSource: e.target.value })} placeholder="Lead source" className="border rounded-2xl px-3 py-2" />
                <select value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })} className="border rounded-2xl px-3 py-2">
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                <input placeholder="Additional contacts (optional)" className="border rounded-2xl px-3 py-2" />
              </div>

              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-heading font-semibold text-[var(--text-body)]">Property address</h3>
                  <p className="text-sm text-[var(--text-muted)]">Enter the service or billing address for this client.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={form.address.street1} onChange={(e) => setForm({ ...form, address: { ...form.address, street1: e.target.value } })} placeholder="Street 1" className="border rounded-2xl px-3 py-2" />
                  <input value={form.address.street2} onChange={(e) => setForm({ ...form, address: { ...form.address, street2: e.target.value } })} placeholder="Street 2" className="border rounded-2xl px-3 py-2" />
                  <input value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} placeholder="City" className="border rounded-2xl px-3 py-2" />
                  <input value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} placeholder="State" className="border rounded-2xl px-3 py-2" />
                  <input value={form.address.zip} onChange={(e) => setForm({ ...form, address: { ...form.address, zip: e.target.value } })} placeholder="ZIP code" className="border rounded-2xl px-3 py-2" />
                  <select value={form.address.country} onChange={(e) => setForm({ ...form, address: { ...form.address, country: e.target.value } })} className="border rounded-2xl px-3 py-2">
                    {['United States', 'Canada', 'Other'].map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--text-body)]">
                  <input
                    type="checkbox"
                    checked={form.billingSameAsProperty}
                    onChange={(e) => setForm({ ...form, billingSameAsProperty: e.target.checked })}
                  />
                  Billing address is the same as property address
                </label>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => setShowFormModal(false)} className="btn-secondary px-5 py-2 text-sm">
                  Cancel
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleCreate(e as unknown as React.FormEvent<HTMLFormElement>, { keepOpen: true })}
                    className="btn-secondary px-5 py-2 text-sm"
                  >
                    Save and create another
                  </button>
                  <button type="submit" className="btn-primary px-5 py-2 text-sm">
                    Save client
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCommunicationSettings && (
        <CommunicationSettingsModal
          preferences={form.communicationPreferences}
          onClose={() => setShowCommunicationSettings(false)}
          onSave={(prefs) => {
            setForm((prev) => ({ ...prev, communicationPreferences: prefs }));
            setShowCommunicationSettings(false);
          }}
        />
      )}
    </div>
  );
}

function getClientStatus(contact: Contact): 'Lead' | 'Active' {
  return contact.project_ids.length > 0 ? 'Active' : 'Lead';
}

function formatLastActivity(date?: string) {
  if (!date) return '—';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '—';
  }
}

function CommunicationSettingsModal({
  preferences,
  onClose,
  onSave,
}: {
  preferences: CommunicationPrefs;
  onClose: () => void;
  onSave: (prefs: CommunicationPrefs) => void;
}) {
  const [draft, setDraft] = useState(preferences);

  const toggle = (key: keyof CommunicationPrefs) =>
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderToggle = (label: string, key: keyof CommunicationPrefs) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[var(--text-body)]">{label}</span>
      <button
        type="button"
        onClick={() => toggle(key)}
        className={`w-12 h-6 rounded-full border flex items-center px-1 transition ${
          draft[key]
            ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] justify-end'
            : 'bg-white border-[var(--border-subtle)] justify-start'
        }`}
      >
        <span className="w-4 h-4 bg-white rounded-full shadow" />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-[var(--border-subtle)] shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-heading text-[var(--text-body)]">Communication settings</h3>
            <p className="text-sm text-[var(--text-muted)]">Automated reminders and follow-ups for this client.</p>
          </div>
          <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
        </div>
        <div className="space-y-4">
          <div className="border border-[var(--border-subtle)] rounded-2xl p-4 space-y-2">
            <p className="text-sm font-semibold text-[var(--text-body)]">Quotes & Invoices</p>
            {renderToggle('Outstanding quote follow-ups', 'quoteFollowUps')}
            {renderToggle('Overdue invoice follow-ups', 'invoiceFollowUps')}
          </div>
          <div className="border border-[var(--border-subtle)] rounded-2xl p-4 space-y-2">
            <p className="text-sm font-semibold text-[var(--text-body)]">Jobs & Visits</p>
            {renderToggle('Visit reminders', 'visitReminders')}
            {renderToggle('Job closure follow-ups', 'jobClosureFollowUps')}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          <button onClick={() => onSave(draft)} className="btn-primary px-5 py-2 text-sm">Save</button>
        </div>
      </div>
    </div>
  );
}
