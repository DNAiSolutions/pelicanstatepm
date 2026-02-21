import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Plus, Trash2, PenSquare, Search } from 'lucide-react';

import { useProfileData } from '../hooks/useProfileData';
import { useAuth } from '../context/AuthContext';
import { contactService } from '../services/contactService';
import { propertyService } from '../services/propertyService';
import { workRequestService } from '../services/workRequestService';
import { quoteService } from '../services/quoteService';
import { SERVICE_CATALOG, type ServiceCatalogItem } from '../data/serviceCatalog';
import { getWorkOrderById } from '../data/pipeline';
import type { QuoteLineItem } from '../data/pipeline';
import type { Property as PropertyRecord, Contact } from '../types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

type LineItem = {
  id: string;
  description: string;
  detail: string;
  quantity: number;
  unitPrice: number;
};

type ClientOption = Contact & {
  propertyName?: string | null;
  propertyAddress?: string;
  statusLabel: 'Lead' | 'Active';
};

const createLineItem = (): LineItem => ({
  id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  description: '',
  detail: '',
  quantity: 1,
  unitPrice: 0,
});

export function EstimateNewPage() {
  const { id: initialWorkRequestId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const profileData = useProfileData();
  const isDemoProfile = !profileData.isAdminProfile;

  const [workRequestId, setWorkRequestId] = useState<string | null>(initialWorkRequestId ?? null);
  const [quoteTitle, setQuoteTitle] = useState('New Quote');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([createLineItem()]);
  const [clientMessage, setClientMessage] = useState('Thanks for the opportunity. Let us know if you need adjustments.');
  const [contractText, setContractText] = useState(
    'Any unforeseen conditions or additional work shall require a change order and may adjust the contract price.'
  );
  const [depositSettings, setDepositSettings] = useState({ card: true, ach: true, requireMethod: true });
  const [notes, setNotes] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState({ created: new Date().toLocaleDateString(), sent: '', approved: '', emailOpened: '', viewed: '' });
  const [clientSnapshot, setClientSnapshot] = useState({ name: '', address: '', phone: '', email: '', company: '' });
  const [loadingExternalData, setLoadingExternalData] = useState(profileData.isAdminProfile);
  const [contacts, setContacts] = useState<Contact[]>(profileData.contacts as Contact[]);
  const [properties, setProperties] = useState<PropertyRecord[]>(profileData.properties as PropertyRecord[]);
  const [saving, setSaving] = useState(false);
  const [activeCatalogLine, setActiveCatalogLine] = useState<string | null>(null);

  useEffect(() => {
    if (!profileData.isAdminProfile) {
      setLoadingExternalData(false);
      return;
    }
    let isMounted = true;
    (async () => {
      try {
        setLoadingExternalData(true);
        const [contactsResponse, propertiesResponse] = await Promise.all([
          contactService.list(),
          propertyService.getProperties(),
        ]);
        if (!isMounted) return;
        setContacts(contactsResponse);
        setProperties(propertiesResponse as PropertyRecord[]);
      } catch (error) {
        console.error(error);
        toast.error('Unable to load clients');
      } finally {
        if (isMounted) setLoadingExternalData(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [profileData.isAdminProfile]);

  const propertyMap = useMemo(() => {
    const map = new Map<string, { name?: string; address?: string }>();
    properties.forEach((property) =>
      map.set(property.id, { name: property.name, address: property.address ?? '' })
    );
    return map;
  }, [properties]);

  const clientOptions = useMemo<ClientOption[]>(
    () =>
      contacts
        .filter((contact) => contact.type === 'Client')
        .map((contact) => ({
          ...contact,
          propertyName: contact.property_id ? propertyMap.get(contact.property_id)?.name ?? null : null,
          propertyAddress: contact.property_id ? propertyMap.get(contact.property_id)?.address ?? '' : '',
          statusLabel: contact.lead_ids && contact.lead_ids.length ? 'Lead' : 'Active',
        })),
    [contacts, propertyMap]
  );

  const selectedClient = clientOptions.find((client) => client.id === selectedClientId) ?? null;

  useEffect(() => {
    if (selectedClient) {
      setClientSnapshot({
        name: selectedClient.name,
        address: selectedClient.propertyAddress ?? '',
        phone: selectedClient.phone ?? '',
        email: selectedClient.email ?? '',
        company: selectedClient.company ?? '',
      });
    }
  }, [selectedClient, propertyMap]);

  useEffect(() => {
    if (!initialWorkRequestId) return;
    if (profileData.isAdminProfile) {
      (async () => {
        try {
          const remote = await workRequestService.getWorkRequest(initialWorkRequestId);
          if (remote) {
            setQuoteTitle(remote.description ?? remote.property ?? 'New Quote');
            setQuoteNumber(remote.request_number ?? 'WR');
            setTimeline((prev) => ({ ...prev, created: new Date(remote.created_at ?? Date.now()).toLocaleDateString() }));
            if (remote.client_contact_id) {
              setSelectedClientId(remote.client_contact_id);
            }
          }
        } catch (error) {
          console.warn('Unable to load work request', error);
        }
      })();
      return;
    }

    const workOrder = getWorkOrderById(initialWorkRequestId);
    if (workOrder) {
      setQuoteTitle(workOrder.title ?? (workOrder as any).property ?? 'New Quote');
      setQuoteNumber(workOrder.requestNumber ?? 'WR');
      setTimeline((prev) => ({ ...prev, created: new Date(workOrder.createdAt ?? Date.now()).toLocaleDateString() }));
    }
  }, [initialWorkRequestId, profileData.isAdminProfile]);

  const subtotal = useMemo(() => lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0), [lineItems]);

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return clientOptions;
    return clientOptions.filter((client) =>
      [client.name, client.company, client.email, client.phone].some((value) => value?.toLowerCase().includes(query))
    );
  }, [clientOptions, clientSearch]);

  const filteredCatalog = useMemo(() => {
    if (!activeCatalogLine) return [] as ServiceCatalogItem[];
    const targetItem = lineItems.find((item) => item.id === activeCatalogLine);
    const term = targetItem?.description.trim().toLowerCase() ?? '';
    if (!term) return SERVICE_CATALOG;
    return SERVICE_CATALOG.filter((service) =>
      service.name.toLowerCase().includes(term) || service.description.toLowerCase().includes(term)
    );
  }, [activeCatalogLine, lineItems]);

  const updateLineItem = (lineId: string, key: keyof LineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? {
              ...item,
              [key]: key === 'quantity' || key === 'unitPrice' ? Number(value) : value,
            }
          : item
      )
    );
  };

  const removeLineItem = (lineId: string) => {
    setLineItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== lineId)));
  };

  const applyCatalogItem = (lineId: string, catalogItem: ServiceCatalogItem) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === lineId
          ? {
              ...item,
              description: catalogItem.name,
              detail: catalogItem.description,
              unitPrice: catalogItem.unitPrice,
            }
          : item
      )
    );
    setActiveCatalogLine(null);
  };

  const validateForm = () => {
    if (!quoteTitle.trim()) {
      toast.error('Add a quote title');
      return false;
    }
    if (!selectedClient) {
      toast.error('Select a client');
      return false;
    }
    const hasMeaningfulLine = lineItems.some((item) => item.description.trim().length > 0);
    if (!hasMeaningfulLine) {
      toast.error('Add at least one line item');
      return false;
    }
    return true;
  };

  const buildLineItemsPayload = (): QuoteLineItem[] =>
    lineItems
      .filter((item) => item.description.trim().length > 0)
      .map((item) => ({
        id: item.id,
        description: item.description,
        detail: item.detail,
        laborClass: 'General',
        quantity: Number(item.quantity) || 0,
        unitCost: Number(item.unitPrice) || 0,
        total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      }));

  const handleSave = async () => {
    if (!validateForm()) return;
    if (isDemoProfile) {
      toast.success('Quote saved (demo)');
      navigate('/quotes');
      return;
    }

    if (!selectedClient) {
      toast.error('Select a client');
      return;
    }

    if (!selectedClient.property_id) {
      toast.error('Selected client has no property assigned');
      return;
    }

    try {
      setSaving(true);
      let targetWorkRequestId = workRequestId;

      if (!targetWorkRequestId) {
        if (!user?.id) {
          toast.error('You must be signed in to create quotes');
          return;
        }
        const created = await workRequestService.createWorkRequest({
          request_number: quoteNumber || `WR-${Date.now()}`,
          property_id: selectedClient.property_id,
          property: selectedClient.propertyName ?? selectedClient.company ?? selectedClient.name,
          is_historic: false,
          category: 'Capital Improvement',
          description: quoteTitle,
          status: 'Intake',
          priority: 'Medium',
          scope_of_work: lineItems.map((item) => item.description).join(', '),
          inspection_notes: clientMessage,
          created_by: user.id,
          submitted_via: 'Internal',
          client_contact_id: selectedClient.id,
        } as any);
        targetWorkRequestId = created.id;
        setWorkRequestId(created.id);
      }

      const payload = {
        workRequestId: targetWorkRequestId!,
        lineItems: buildLineItemsPayload(),
        totalAmount: subtotal,
        clientContactId: selectedClient.id,
        clientSnapshot: {
          ...clientSnapshot,
          status: selectedClient.statusLabel,
          propertyName: selectedClient.propertyName,
        },
        clientMessage,
        contractText,
        paymentSettings: { deposit: depositSettings, timeline },
        status: 'Draft' as const,
        notes,
      };

      const result = await quoteService.create(payload);
      toast.success('Quote saved');
      navigate(`/quotes/${result.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Unable to save quote');
    } finally {
      setSaving(false);
    }
  };

  if (loadingExternalData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <Search className="w-5 h-5 animate-spin" /> Loading clients…
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <button onClick={() => navigate('/quotes')} className="flex items-center gap-2 text-[#0f2749] hover:text-[#0f2749]/80">
        <ArrowLeft className="w-4 h-4" /> Back to Quotes
      </button>

      <section className="card p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[240px] space-y-2">
            <input
              value={quoteTitle}
              onChange={(e) => setQuoteTitle(e.target.value)}
              placeholder="Quote title"
              className="w-full text-3xl font-heading text-[var(--text-body)] bg-transparent border-none focus:outline-none"
            />
            <p className="text-sm text-[var(--text-muted)]">
              {selectedClient?.propertyName ?? 'Select a client property'}
            </p>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Draft
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-[var(--text-muted)]">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em]">Quote #</span>
              <input
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="w-full border rounded-2xl px-3 py-2"
                placeholder="Auto"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em]">Created</span>
              <input
                value={timeline.created}
                onChange={(e) => setTimeline({ ...timeline, created: e.target.value })}
                className="w-full border rounded-2xl px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em]">Sent</span>
              <input
                value={timeline.sent}
                onChange={(e) => setTimeline({ ...timeline, sent: e.target.value })}
                className="w-full border rounded-2xl px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.2em]">Approved</span>
              <input
                value={timeline.approved}
                onChange={(e) => setTimeline({ ...timeline, approved: e.target.value })}
                className="w-full border rounded-2xl px-3 py-2"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)] mb-2">Select a client</p>
            <div className="relative">
              <input
                onFocus={() => setClientDropdownOpen(true)}
                value={selectedClient ? selectedClient.name : clientSearch}
                onChange={(e) => {
                  setClientDropdownOpen(true);
                  setSelectedClientId(null);
                  setClientSearch(e.target.value);
                }}
                placeholder="Search clients"
                className="w-full border rounded-2xl px-4 py-3"
              />
              {clientDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-[var(--border-subtle)] rounded-3xl shadow-xl max-h-72 overflow-y-auto z-20">
                  {filteredClients.length === 0 && (
                    <p className="text-sm text-[var(--text-muted)] p-4">No matching clients</p>
                  )}
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--brand-sand)] transition"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setClientDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[var(--text-body)]">{client.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{client.company}</p>
                          <p className="text-xs text-[var(--text-muted)]">{client.email}</p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            client.statusLabel === 'Lead'
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {client.statusLabel}
                        </span>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-[var(--border-subtle)]">
                    <button
                      className="w-full text-left px-4 py-3 text-sm text-[var(--brand-primary)] font-semibold"
                      onClick={() => toast('Client creation coming soon')}
                    >
                      + Create new client
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs text-[var(--text-muted)]">
              Email opened
              <input
                value={timeline.emailOpened}
                onChange={(e) => setTimeline({ ...timeline, emailOpened: e.target.value })}
                className="w-full border rounded-2xl px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-xs text-[var(--text-muted)]">
              Viewed
              <input
                value={timeline.viewed}
                onChange={(e) => setTimeline({ ...timeline, viewed: e.target.value })}
                className="w-full border rounded-2xl px-3 py-2"
              />
            </label>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-0">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Product / Service</p>
                <h2 className="text-xl font-heading text-[var(--text-body)]">Line Items</h2>
              </div>
              <button className="btn-secondary text-xs" onClick={() => setLineItems((prev) => [...prev, createLineItem()])}>
                <Plus className="w-3.5 h-3.5" /> Add line item
              </button>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {lineItems.map((item) => (
                <div key={item.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <input
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      onFocus={() => setActiveCatalogLine(item.id)}
                      placeholder="Line item name"
                      className="flex-1 text-lg font-semibold border-none bg-transparent focus:outline-none"
                    />
                    {lineItems.length > 1 && (
                      <button onClick={() => removeLineItem(item.id)} className="text-[var(--text-muted)]">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {activeCatalogLine === item.id && filteredCatalog.length > 0 && (
                    <div className="border border-[var(--border-subtle)] rounded-2xl max-h-48 overflow-y-auto">
                      {filteredCatalog.map((service) => (
                        <button
                          key={service.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--brand-sand)]"
                          onClick={() => applyCatalogItem(item.id, service)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-[var(--text-body)]">{service.name}</p>
                              <p className="text-xs text-[var(--text-muted)]">{service.description}</p>
                            </div>
                            <span className="text-xs text-[var(--text-muted)]">{formatCurrency(service.unitPrice)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={item.detail}
                    onChange={(e) => updateLineItem(item.id, 'detail', e.target.value)}
                    placeholder="Describe the scope"
                    rows={2}
                    className="w-full text-sm text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-2xl px-3 py-2"
                  />
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <label className="space-y-1">
                      <span className="text-xs text-[var(--text-muted)]">Quantity</span>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                        className="w-full border rounded-2xl px-3 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-[var(--text-muted)]">Unit price</span>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value)}
                        className="w-full border rounded-2xl px-3 py-2"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-[var(--text-muted)]">Total</span>
                      <input
                        value={formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                        readOnly
                        className="w-full border bg-neutral-50 rounded-2xl px-3 py-2"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 flex flex-col items-end text-sm">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
                <button className="text-[var(--brand-primary)]">Add Discount</button>
                <button className="text-[var(--brand-primary)]">Add Tax</button>
              </div>
              <p className="text-lg font-heading text-[var(--text-body)] mt-2">Total {formatCurrency(subtotal)}</p>
              <button className="text-sm text-[var(--brand-primary)] mt-2">Add Deposit or Payment Schedule</button>
            </div>
          </section>

          <section className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Client message</p>
                <h3 className="text-lg font-heading text-[var(--text-body)]">Add a note</h3>
              </div>
            </div>
            <textarea
              value={clientMessage}
              onChange={(e) => setClientMessage(e.target.value)}
              rows={3}
              className="w-full border rounded-2xl px-4 py-3"
            />
          </section>

          <section className="card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Contract / Disclaimer</p>
                <h3 className="text-lg font-heading text-[var(--text-body)]">Terms</h3>
              </div>
            </div>
            <textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              rows={4}
              className="w-full border rounded-2xl px-4 py-3"
            />
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <PenSquare className="w-4 h-4" /> Signature capture will appear for clients
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Customize</p>
            {[
              { label: 'Card (Credit/Debit)', key: 'card' },
              { label: 'Bank (ACH)', key: 'ach' },
              { label: 'Require payment method on file', key: 'requireMethod' },
            ].map((setting) => (
              <label key={setting.key} className="flex items-center justify-between text-sm">
                {setting.label}
                <input
                  type="checkbox"
                  checked={(depositSettings as Record<string, boolean>)[setting.key]}
                  onChange={(e) => setDepositSettings((prev) => ({ ...prev, [setting.key]: e.target.checked }))}
                />
              </label>
            ))}
          </section>

          <section className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Notes</p>
              <button className="btn-secondary text-xs" onClick={() => setNotes('')}>
                Clear
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full border rounded-2xl px-4 py-3"
              placeholder="Internal notes only"
            />
          </section>

          <div className="space-y-3">
            <button className="btn-primary w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Quote'}
            </button>
            <button className="btn-secondary w-full" onClick={() => navigate('/quotes')}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
