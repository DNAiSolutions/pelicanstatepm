import { useMemo, useState } from 'react';
import { Calendar, CheckSquare, ImagePlus, Paperclip, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { workRequestService } from '../../services/workRequestService';
import type { Priority, WorkCategory, WorkRequest } from '../../types';

type RequestContact = {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  propertyId?: string;
  statusLabel?: string;
};

type RequestProperty = {
  id: string;
  name: string;
  address?: string;
};

type RequestLineItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  description?: string;
};

const CATEGORY_OPTIONS: { value: WorkCategory; label: string }[] = [
  { value: 'Emergency Response', label: 'Emergency Response' },
  { value: 'Preventative Maintenance', label: 'Preventative Maintenance' },
  { value: 'Capital Improvement', label: 'Capital Improvement' },
  { value: 'Tenant Improvement', label: 'Tenant Improvement' },
  { value: 'Event Support', label: 'Event Support' },
  { value: 'Grounds & Landscape', label: 'Grounds & Landscape' },
  { value: 'Historic Conservation', label: 'Historic Conservation' },
  { value: 'Small Works', label: 'Small Works' },
];

const TIME_WINDOWS = ['Any time', 'Morning', 'Afternoon', 'Evening'];

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `req-${Math.random().toString(36).slice(2, 10)}`;

export type NewRequestFormProps = {
  mode?: 'internal' | 'portal';
  contacts: RequestContact[];
  properties: RequestProperty[];
  defaultContactId?: string;
  defaultPropertyId?: string;
  contactLocked?: boolean;
  propertyLocked?: boolean;
  createdById?: string;
  onSuccess?: (request: WorkRequest) => void;
  onCancel?: () => void;
};

export function NewRequestForm({
  mode = 'internal',
  contacts,
  properties,
  defaultContactId,
  defaultPropertyId,
  contactLocked,
  propertyLocked,
  createdById,
  onSuccess,
  onCancel,
}: NewRequestFormProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [selectedContactId, setSelectedContactId] = useState(
    defaultContactId || contacts[0]?.id || ''
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    defaultPropertyId || properties[0]?.id || ''
  );
  const [priority, setPriority] = useState<Priority>('Medium');
  const [category, setCategory] = useState<WorkCategory>('Emergency Response');
  const [serviceDetails, setServiceDetails] = useState('');
  const [primaryDate, setPrimaryDate] = useState('');
  const [alternateDate, setAlternateDate] = useState('');
  const [preferredWindows, setPreferredWindows] = useState<string[]>([]);
  const [imageLinks, setImageLinks] = useState<string[]>([]);
  const [newImageInput, setNewImageInput] = useState('');
  const [onsiteNotes, setOnsiteNotes] = useState('');
  const [lineItems, setLineItems] = useState<RequestLineItem[]>([
    { id: createId(), name: '', quantity: 1, unitPrice: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const propertyName = useMemo(() => {
    return properties.find((property) => property.id === selectedPropertyId)?.name || '';
  }, [selectedPropertyId, properties]);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId),
    [contacts, selectedContactId]
  );

  const subtotal = useMemo(
    () =>
      lineItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
      ),
    [lineItems]
  );

  const toggleWindow = (window: string) => {
    setPreferredWindows((prev) =>
      prev.includes(window) ? prev.filter((entry) => entry !== window) : [...prev, window]
    );
  };

  const updateLineItem = (id: string, key: keyof RequestLineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: key === 'quantity' || key === 'unitPrice' ? Number(value) : value,
            }
          : item
      )
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { id: createId(), name: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const handleAddImage = () => {
    if (!newImageInput.trim()) return;
    setImageLinks((prev) => [...prev, newImageInput.trim()]);
    setNewImageInput('');
  };

  const handleAddAttachment = () => {
    const url = window.prompt('Paste a link to the document or photo');
    if (url) setAttachments((prev) => [...prev, url]);
  };

  const validate = () => {
    if (!title.trim()) {
      toast.error('Add a request title');
      return false;
    }
    if (!selectedContactId) {
      toast.error('Select a client contact');
      return false;
    }
    if (!selectedPropertyId) {
      toast.error('Select a property');
      return false;
    }
    if (!serviceDetails.trim()) {
      toast.error('Share a short description in the overview section');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const intakePayload = {
        serviceDetails,
        availability: {
          primaryDate,
          alternateDate,
          windows: preferredWindows,
        },
        attachments: imageLinks,
        onsiteNotes,
        lineItems,
        notes,
        supplementalFiles: attachments,
        submittedBy: selectedContact?.name,
        submittedVia: mode,
      };

      const response = await workRequestService.createWorkRequest({
        title,
        request_number: `WR-${Date.now()}`,
        property_id: selectedPropertyId,
        property: propertyName || selectedContact?.company || 'Client property',
        is_historic: false,
        category,
        description: serviceDetails,
        priority,
        scope_of_work: serviceDetails,
        inspection_notes: notes || onsiteNotes,
        status: 'Intake',
        created_by: createdById || 'portal-client',
        client_contact_id: selectedContactId,
        submitted_via: mode === 'portal' ? 'ClientPortal' : 'Internal',
        intake_payload: intakePayload,
      } as any);

      toast.success('Request saved');
      onSuccess?.(response);
      if (!onSuccess) {
        navigate(`/work-requests/${response.id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to save request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const heroBorder = mode === 'portal' ? 'border-emerald-100' : 'border-[var(--border-subtle)]';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className={`bg-white border ${heroBorder} rounded-3xl p-6 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">New Request</p>
            <h1 className="text-3xl font-heading text-[var(--text-body)]">Log a service need</h1>
            <p className="text-sm text-[var(--text-muted)]">Requested on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1 px-3 py-1 border rounded-full">
              <CheckSquare className="w-3.5 h-3.5" /> Intake
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 border rounded-full">
              {mode === 'portal' ? 'Client Portal' : 'Ops Team'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-body)]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lobby lighting upgrade"
              className="input-field"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-body)]">Client contact</label>
            <select
              value={selectedContactId}
              onChange={(e) => !contactLocked && setSelectedContactId(e.target.value)}
              disabled={contactLocked}
              className="input-field"
            >
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} • {contact.company}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-body)]">Property</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => !propertyLocked && setSelectedPropertyId(e.target.value)}
              disabled={propertyLocked}
              className="input-field"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-body)]">Priority</label>
            <div className="flex gap-2 flex-wrap">
              {(['Critical', 'High', 'Medium', 'Low'] as Priority[]).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setPriority(level)}
                  className={`px-3 py-1.5 text-xs rounded-full border ${
                    priority === level
                      ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-body)]">Service Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WorkCategory)}
              className="input-field"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div>
          <h2 className="text-xl font-heading text-[var(--text-body)]">Overview</h2>
          <p className="text-sm text-[var(--text-muted)]">Please provide as much information as you can.</p>
        </div>
        <textarea
          value={serviceDetails}
          onChange={(e) => setServiceDetails(e.target.value)}
          rows={4}
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="Outline the issue, affected areas, safety considerations, or photos to include."
        />
      </section>

      <section className="card p-6 space-y-4">
        <div>
          <h2 className="text-xl font-heading text-[var(--text-body)]">Your Availability</h2>
          <p className="text-sm text-[var(--text-muted)]">Coordinate a site walk or service visit.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-body)]">Preferred assessment date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="date"
                value={primaryDate}
                onChange={(e) => setPrimaryDate(e.target.value)}
                className="w-full border rounded-full pl-10 pr-4 py-2"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-body)]">Alternate day</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="date"
                value={alternateDate}
                onChange={(e) => setAlternateDate(e.target.value)}
                className="w-full border rounded-full pl-10 pr-4 py-2"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-body)]">Preferred arrival windows</label>
          <div className="flex flex-wrap gap-3">
            {TIME_WINDOWS.map((window) => (
              <button
                type="button"
                key={window}
                onClick={() => toggleWindow(window)}
                className={`px-4 py-2 rounded-full border text-sm ${
                  preferredWindows.includes(window)
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {window}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading text-[var(--text-body)]">Upload images</h2>
            <p className="text-sm text-[var(--text-muted)]">Share images of the work to be done (optional)</p>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{imageLinks.length}/10</span>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="border border-dashed border-neutral-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center text-sm text-neutral-500 gap-2 min-h-[160px]">
              <ImagePlus className="w-6 h-6 text-neutral-400" />
              <p>Paste a link to a photo or drop files in the uploader below.</p>
              <div className="flex w-full gap-2">
                <input
                  value={newImageInput}
                  onChange={(e) => setNewImageInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 border rounded-full px-4 py-2"
                />
                <button type="button" onClick={handleAddImage} className="btn-secondary px-4 py-2">
                  Add
                </button>
              </div>
            </div>
          </div>
          {imageLinks.length > 0 && (
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-[var(--text-body)]">Attached links</p>
              <ul className="space-y-2">
                {imageLinks.map((link) => (
                  <li key={link} className="text-xs text-[var(--text-muted)] truncate">{link}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div>
          <h2 className="text-xl font-heading text-[var(--text-body)]">On-site assessment</h2>
          <p className="text-sm text-[var(--text-muted)]">Visit the property to assess the job before you do the work</p>
        </div>
        <textarea
          value={onsiteNotes}
          onChange={(e) => setOnsiteNotes(e.target.value)}
          rows={3}
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="List any access instructions, escorts required, or known risks."
        />
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading text-[var(--text-body)]">Product / Service</h2>
            <p className="text-sm text-[var(--text-muted)]">Keep everything on track by adding products and services.</p>
          </div>
          <button type="button" className="btn-secondary text-sm" onClick={addLineItem}>
            <Plus className="w-4 h-4" /> Add line item
          </button>
        </div>
        <div className="space-y-3">
          {lineItems.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-center border border-neutral-200 rounded-2xl p-3">
              <input
                value={item.name}
                onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                placeholder="Service name"
                className="border rounded-2xl px-3 py-2"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                className="border rounded-2xl px-3 py-2"
                min={0}
              />
              <input
                type="number"
                value={item.unitPrice}
                onChange={(e) => updateLineItem(item.id, 'unitPrice', e.target.value)}
                className="border rounded-2xl px-3 py-2"
                min={0}
              />
              <button
                type="button"
                onClick={() => removeLineItem(item.id)}
                className="text-red-500 justify-self-end"
                aria-label="Remove line item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="text-right text-sm text-[var(--text-muted)]">
          <p>Subtotal: {formatCurrency(subtotal)}</p>
          <p className="font-semibold text-[var(--text-body)]">Total: {formatCurrency(subtotal)}</p>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading text-[var(--text-body)]">Notes</h2>
            <p className="text-sm text-[var(--text-muted)]">Leave an internal note for yourself or a teammate.</p>
          </div>
          <button type="button" className="btn-secondary text-sm" onClick={handleAddAttachment}>
            <Paperclip className="w-4 h-4" /> Attach files
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full border rounded-2xl px-4 py-3"
          placeholder="Share scheduling context, approvals, or link out to folders."
        />
        {attachments.length > 0 && (
          <ul className="text-xs text-[var(--text-muted)] space-y-1">
            {attachments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            if (onCancel) {
              onCancel();
            } else {
              navigate(-1);
            }
          }}
          className="btn-secondary px-6 py-3 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary px-6 py-3 text-sm disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : 'Save request'}
        </button>
      </div>
    </form>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value || 0);
}
