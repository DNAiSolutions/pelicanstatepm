import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, Printer } from 'lucide-react';
import { useProfileData } from '../hooks/useProfileData';
import { quoteService } from '../services/quoteService';
import { getQuoteById, getWorkOrderById, getPropertyById, getSiteById, type QuoteLineItem } from '../data/pipeline';

type QuoteLineItemLike = QuoteLineItem & Record<string, any>;

type QuoteDetail = {
  id: string;
  workRequestId: string;
  requestNumber: string;
  title: string;
  propertyName: string | null;
  siteName: string;
  status: string;
  totalAmount: number;
  updatedAt?: string | null;
  createdAt?: string | null;
  notes?: string | null;
  lineItems: QuoteLineItemLike[];
  clientSnapshot?: Record<string, any> | null;
  clientMessage?: string | null;
  contractText?: string | null;
  paymentSettings?: Record<string, any> | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const formatQuantity = (item: QuoteLineItemLike) => item.quantity ?? item.labor_hours ?? item.hours ?? '—';

const formatUnit = (item: QuoteLineItemLike) => {
  if (item.unit) return item.unit;
  if (item.unitCost) return `$${item.unitCost}`;
  if (item.rate) return `$${item.rate}`;
  return '—';
};

const formatTotal = (item: QuoteLineItemLike) => item.total ?? item.amount ?? 0;

export function QuoteDetailPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { isAdminProfile } = useProfileData();
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!quoteId) {
        setError('Quote not found');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        if (isAdminProfile) {
          const record = await quoteService.getById(quoteId);
          if (!record) {
            setError('Quote not found');
            setQuote(null);
          } else {
            setQuote({
              id: record.id,
              workRequestId: record.workRequestId,
              requestNumber: record.requestNumber,
              title: record.title,
              propertyName: record.propertyName,
              siteName: record.siteName,
              status: record.status,
              totalAmount: record.totalAmount,
              updatedAt: record.updatedAt,
              createdAt: record.createdAt,
              notes: record.notes ?? undefined,
              lineItems: (record.lineItems as QuoteLineItemLike[]) ?? [],
              clientSnapshot: (record as any).clientSnapshot ?? null,
              clientMessage: (record as any).clientMessage ?? null,
              contractText: (record as any).contractText ?? null,
              paymentSettings: (record as any).paymentSettings ?? null,
            });
          }
        } else {
          const mockQuote = getQuoteById(quoteId);
          if (!mockQuote) {
            setError('Quote not found');
            setQuote(null);
          } else {
            const workOrder = getWorkOrderById(mockQuote.workOrderId);
            const site = workOrder ? getSiteById(workOrder.siteId) : null;
            const property = site ? getPropertyById(site.propertyId) : null;
            setQuote({
              id: mockQuote.id,
              workRequestId: mockQuote.workOrderId,
              requestNumber: workOrder?.requestNumber ?? mockQuote.id,
              title: workOrder?.title ?? 'Work Request',
              propertyName: property?.name ?? null,
              siteName: site?.name ?? 'Site',
              status: mockQuote.status,
              totalAmount: mockQuote.totalEstimate,
              updatedAt: mockQuote.approvedAt ?? mockQuote.submittedAt ?? mockQuote.createdAt,
              createdAt: mockQuote.createdAt,
              notes: mockQuote.notes,
              lineItems: mockQuote.lineItems as QuoteLineItemLike[],
              clientSnapshot: {
                name: (mockQuote as any).client?.name,
                company: (mockQuote as any).client?.company,
                email: (mockQuote as any).client?.email,
                phone: (mockQuote as any).client?.phone,
                propertyName: property?.name,
              },
              clientMessage: mockQuote.notes,
              contractText: (mockQuote as any).contractText ?? undefined,
              paymentSettings: undefined,
            });
          }
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unable to load quote');
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quoteId, isAdminProfile]);

  useEffect(() => {
    if (quote?.notes) {
      setNotesDraft(quote.notes);
    }
  }, [quote?.notes]);

  const statusBadgeClass = useMemo(() => {
    switch (quote?.status) {
      case 'Approved':
        return 'bg-green-100 text-green-700';
      case 'Submitted':
        return 'bg-blue-100 text-blue-700';
      case 'Changes Requested':
        return 'bg-amber-100 text-amber-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  }, [quote?.status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)]">
        Loading quote…
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-4 py-12">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <p className="text-[var(--text-muted)]">{error ?? 'Quote not found'}</p>
        <button onClick={() => navigate('/quotes')} className="text-[var(--brand-primary)] hover:underline">
          Back to Quotes
        </button>
      </div>
    );
  }

  const aiSummary = `AI suggests presenting this ${quote.status.toLowerCase()} quote with clear milestone dates and emphasizes a total of ${formatCurrency(quote.totalAmount)}.`;
  const clientSnapshot = quote.clientSnapshot || {};
  const paymentSettings = (quote.paymentSettings ?? {}) as Record<string, any>;
  const timeline = (paymentSettings.timeline ?? {}) as Record<string, string>;
  const timelineDisplay = {
    created: timeline.created ?? quote.createdAt ?? '',
    sent: timeline.sent ?? '',
    approved: timeline.approved ?? '',
    emailOpened: timeline.emailOpened ?? '',
    viewed: timeline.viewed ?? '',
  };
  const depositSettings = (paymentSettings.deposit ?? {}) as Record<string, boolean>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <button onClick={() => navigate('/quotes')} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-body)]">
        <ArrowLeft className="w-4 h-4" /> Back to Quotes
      </button>

      <section className="card p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
              <span>Quote #{quote.requestNumber}</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full font-semibold ${statusBadgeClass}`}>{quote.status}</span>
            </div>
            <h1 className="text-3xl font-heading text-[var(--text-body)]">{quote.title}</h1>
            <p className="text-sm text-[var(--text-muted)]">{quote.propertyName ?? 'No property'} • {quote.siteName}</p>
            <div className="border border-[var(--border-subtle)] rounded-3xl p-4 space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Client</p>
              <p className="font-semibold text-[var(--text-body)]">{clientSnapshot.name ?? '—'}</p>
              <p className="text-xs text-[var(--text-muted)]">{clientSnapshot.company ?? ''}</p>
              <p className="text-xs text-[var(--text-muted)]">{clientSnapshot.email ?? ''}</p>
              <p className="text-xs text-[var(--text-muted)]">{clientSnapshot.phone ?? ''}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" /> Send to Client
              </button>
              <button className="btn-secondary text-sm flex items-center gap-2">
                <Printer className="w-4 h-4" /> Download PDF
              </button>
            </div>
            <button className="btn-secondary text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Convert to Job
            </button>
            <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-muted)]">
              {(['created', 'sent', 'approved', 'emailOpened', 'viewed'] as const).map((key) => (
                <div key={key}>
                  <p className="uppercase tracking-[0.2em]">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-[var(--text-body)] font-semibold">{timelineDisplay[key] || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section className="card">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Line Items</p>
                <h2 className="text-xl font-heading text-[var(--text-body)]">Scope & Pricing</h2>
              </div>
              <button className="btn-secondary text-xs">New Line Item</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--brand-sand)] text-[var(--text-muted)] text-xs">
                  <tr>
                    <th className="text-left py-3 px-4">Product / Service</th>
                    <th className="text-right py-3 px-4">Qty</th>
                    <th className="text-right py-3 px-4">Unit</th>
                    <th className="text-right py-3 px-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lineItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[var(--text-muted)]">No line items on this quote yet.</td>
                    </tr>
                  )}
                  {quote.lineItems.map((item, index) => (
                    <tr key={index} className="border-t border-[var(--border-subtle)]">
                      <td className="py-4 px-4">
                        <p className="font-medium text-[var(--text-body)]">{item.description || item.product_name || 'Line Item'}</p>
                        {item.detail && <p className="text-xs text-[var(--text-muted)] mt-1">{item.detail}</p>}
                      </td>
                      <td className="py-4 px-4 text-right text-[var(--text-muted)]">{formatQuantity(item)}</td>
                      <td className="py-4 px-4 text-right text-[var(--text-muted)]">{formatUnit(item)}</td>
                      <td className="py-4 px-4 text-right font-semibold text-[var(--text-body)]">{formatCurrency(formatTotal(item))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Payment settings</p>
                <h3 className="text-lg font-heading text-[var(--text-body)]">Customize</h3>
              </div>
              <div className="space-y-3 text-sm">
                {[{ label: 'Card (Credit/Debit)', key: 'card' }, { label: 'Bank (ACH)', key: 'ach' }, { label: 'Require payment method on file', key: 'requireMethod' }].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between">
                    {setting.label}
                    <span className={`px-3 py-1 rounded-full text-xs ${depositSettings[setting.key] ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                      {depositSettings[setting.key] ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5 space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">AI Insights</p>
              <p className="text-sm text-[var(--text-body)]">{aiSummary}</p>
              <button className="text-xs text-[var(--brand-primary)] underline">Review suggestion history</button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Client message</p>
                <h3 className="text-lg font-heading text-[var(--text-body)]">Visible to client</h3>
              </div>
            </div>
            <p className="text-sm text-[var(--text-body)]">{quote.clientMessage ?? '—'}</p>
          </section>

          <section className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Contract / Disclaimer</p>
                <h3 className="text-lg font-heading text-[var(--text-body)]">Terms</h3>
              </div>
            </div>
            <p className="text-sm text-[var(--text-body)]">{quote.contractText ?? '—'}</p>
          </section>

          <section className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Internal Notes</p>
                <h3 className="text-lg font-heading text-[var(--text-body)]">Team Only</h3>
              </div>
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={5}
              className="input-field"
              placeholder="Add any context only your Pelican team can see"
            />
            <p className="text-xs text-[var(--text-muted)]">Notes auto-save when you convert or approve the quote.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
