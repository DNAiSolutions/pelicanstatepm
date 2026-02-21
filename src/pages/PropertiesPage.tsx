import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Building2, Flag, Loader2, MapPin, Plus, Shield, Sparkles, X } from 'lucide-react';
import { propertyService } from '../services/propertyService';
import type { Priority, Property } from '../types';
import toast from 'react-hot-toast';

type PropertyFormState = {
  name: string;
  address: string;
  fundingSource: string;
  priority: Priority;
  isHistoric: boolean;
  notes: string;
};

const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

const EMPTY_FORM: PropertyFormState = {
  name: '',
  address: '',
  fundingSource: '',
  priority: 'Medium',
  isHistoric: false,
  notes: '',
};

export function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState<PropertyFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        const list = await propertyService.list();
        setProperties(list);
      } catch (error) {
        console.error('Failed to load properties', error);
        toast.error('Unable to load properties');
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  const stats = useMemo(() => {
    const total = properties.length;
    const critical = properties.filter((property) => property.priority === 'Critical').length;
    const historic = properties.filter((property) => property.is_historic).length;
    return { total, critical, historic };
  }, [properties]);

  const sortedProperties = useMemo(
    () => [...properties].sort((a, b) => a.name.localeCompare(b.name)),
    [properties]
  );

  const openCreateDrawer = () => {
    setFormMode('create');
    setForm(EMPTY_FORM);
    setEditingProperty(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (property: Property) => {
    setFormMode('edit');
    setEditingProperty(property);
    setForm({
      name: property.name,
      address: property.address ?? '',
      fundingSource: property.funding_source ?? '',
      priority: property.priority ?? 'Medium',
      isHistoric: Boolean(property.is_historic),
      notes: property.notes ?? '',
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSaving(false);
    setForm(EMPTY_FORM);
    setEditingProperty(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Enter a property name');
      return;
    }
    if (!form.address.trim()) {
      toast.error('Enter an address or city');
      return;
    }
    if (!form.fundingSource.trim()) {
      toast.error('Add a funding source');
      return;
    }

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      funding_source: form.fundingSource.trim(),
      priority: form.priority,
      is_historic: form.isHistoric,
      notes: form.notes.trim() || undefined,
    } satisfies Omit<Property, 'id' | 'created_at'>;

    try {
      setSaving(true);
      if (formMode === 'create') {
        const created = await propertyService.createProperty(payload);
        setProperties((prev) => [...prev, created]);
        toast.success(`${created.name} added`);
      } else if (editingProperty) {
        const updated = await propertyService.updateProperty(editingProperty.id, payload);
        setProperties((prev) => prev.map((property) => (property.id === editingProperty.id ? updated : property)));
        toast.success(`${updated.name} updated`);
      }
      closeDrawer();
    } catch (error) {
      console.error('Failed to save property', error);
      toast.error('Unable to save property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="inline-flex items-center gap-3 text-sm text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--brand-primary)]" />
          Loading properties
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Pelican Portfolio</p>
          <h1 className="text-3xl font-heading font-bold text-neutral-900">Properties</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Keep every campus, district, and hospitality site ready for quotes, walkthroughs, and work requests.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
            onClick={() => openCreateDrawer()}
          >
            <Sparkles className="w-4 h-4" /> Smart Intake Ready
          </button>
          <button
            className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white px-5 py-2.5 text-sm shadow-[0_10px_30px_rgba(19,46,72,0.35)]"
            onClick={() => openCreateDrawer()}
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Active Properties"
          value={stats.total}
          description={stats.total ? 'Ready for lead intake and invoicing' : 'No properties yet'}
          icon={<Building2 className="w-5 h-5" />}
        />
        <StatCard
          title="Historic Sites"
          value={stats.historic}
          description="Flagged for conservation workflows"
          icon={<Shield className="w-5 h-5" />}
        />
        <StatCard
          title="Critical Priority"
          value={stats.critical}
          description="Require weekly walkthrough cadence"
          icon={<Flag className="w-5 h-5" />}
        />
      </section>

      {properties.length === 0 ? (
        <section className="border border-dashed border-[rgba(15,39,73,0.25)] p-10 text-center space-y-5 bg-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(15,39,73,0.07)] text-[var(--brand-primary)] mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-heading font-semibold text-neutral-900">Add your first campus</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Leads, quotes, and walkthroughs all anchor to a property. Spin up Wallace-sized jobs or boutique hospitality sites without touching SQL.
          </p>
          <div className="flex flex-col gap-2 text-sm text-neutral-500 max-w-md mx-auto">
            <ChecklistItem label="Name + address" description="What does Pelican call this site internally?" />
            <ChecklistItem label="Funding source" description="State bond, FEMA, or private CapEx" />
            <ChecklistItem label="Priority + historic" description="Drives compliance alerts and AI copy" />
          </div>
          <button
            className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white px-5 py-2.5 text-sm"
            onClick={() => openCreateDrawer()}
          >
            <Plus className="w-4 h-4" /> Create Property
          </button>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {sortedProperties.map((property) => (
            <article key={property.id} className="border border-neutral-200 bg-white p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{property.priority} Priority</p>
                  <h3 className="text-2xl font-heading font-semibold text-neutral-900">{property.name}</h3>
                  <p className="text-sm text-neutral-600 flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-neutral-400" /> {property.address || 'Address TBD'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {property.is_historic && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 tracking-wide uppercase">
                      <Shield className="w-3 h-3" /> Historic
                    </span>
                  )}
                  <button
                    className="text-xs uppercase tracking-[0.2em] text-[var(--brand-primary)]"
                    onClick={() => openEditDrawer(property)}
                  >
                    Manage
                  </button>
                </div>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-neutral-500 uppercase tracking-[0.25em] text-[10px]">Funding</dt>
                  <dd className="font-medium text-neutral-900">{property.funding_source || 'Unassigned'}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500 uppercase tracking-[0.25em] text-[10px]">Historic</dt>
                  <dd className="font-medium text-neutral-900">{property.is_historic ? 'Required' : 'Optional'}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500 uppercase tracking-[0.25em] text-[10px]">Created</dt>
                  <dd className="font-medium text-neutral-900">
                    {property.created_at ? new Date(property.created_at).toLocaleDateString() : '—'}
                  </dd>
                </div>
              </dl>
              {property.notes && <p className="text-sm text-neutral-600">{property.notes}</p>}
            </article>
          ))}
        </section>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-50 flex justify-end">
          <div className="w-full max-w-lg h-full bg-white shadow-[0_40px_120px_rgba(15,31,51,0.28)] p-8 overflow-y-auto">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  {formMode === 'create' ? 'New Property' : 'Update Property'}
                </p>
                <h2 className="text-2xl font-heading font-semibold text-neutral-900">
                  {formMode === 'create' ? 'Pelican Site Blueprint' : editingProperty?.name}
                </h2>
                <p className="text-sm text-neutral-500 mt-2">
                  This powers intake forms, quotes, and walkthrough schedules.
                </p>
              </div>
              <button onClick={closeDrawer} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); handleSubmit(); }}>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">Property Name</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Cypress Arts District"
                  className="w-full border border-neutral-300 px-3 py-2.5"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">Address / City</label>
                <input
                  value={form.address}
                  onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="Street or city, state"
                  className="w-full border border-neutral-300 px-3 py-2.5"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">Funding Source</label>
                <input
                  value={form.fundingSource}
                  onChange={(event) => setForm((prev) => ({ ...prev, fundingSource: event.target.value }))}
                  placeholder="State Bond, FEMA PA, Hospitality CapEx"
                  className="w-full border border-neutral-300 px-3 py-2.5"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as Priority }))}
                    className="w-full border border-neutral-300 px-3 py-2.5"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">Historic Designation</label>
                  <div className="border border-neutral-300 px-3 py-2.5 flex items-center justify-between">
                    <span className="text-sm text-neutral-700">{form.isHistoric ? 'Required' : 'Optional'}</span>
                    <button
                      type="button"
                      className={`w-12 h-6 rounded-full transition-colors ${
                        form.isHistoric ? 'bg-[var(--brand-primary)]' : 'bg-neutral-300'
                      }`}
                      onClick={() => setForm((prev) => ({ ...prev, isHistoric: !prev.isHistoric }))}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                          form.isHistoric ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Internal notes, access instructions, caretaker info"
                  className="w-full border border-neutral-300 px-3 py-2.5 min-h-[120px]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white px-5 py-2.5 text-sm disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {formMode === 'create' ? 'Save Property' : 'Update Property'}
                </button>
                <button type="button" className="text-sm text-neutral-500" onClick={closeDrawer} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, description, icon }: { title: string; value: number; description: string; icon: ReactNode }) {
  return (
    <div className="border border-neutral-200 bg-white p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-[rgba(15,39,73,0.08)] text-[var(--brand-primary)] flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{title}</p>
        <p className="text-2xl font-heading font-semibold text-neutral-900">{value}</p>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

function ChecklistItem({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <div className="w-6 h-6 rounded-full bg-[rgba(15,39,73,0.08)] text-[var(--brand-primary)] flex items-center justify-center text-xs font-semibold">
        ✓
      </div>
      <div>
        <p className="font-medium text-neutral-900 text-sm">{label}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
    </div>
  );
}
