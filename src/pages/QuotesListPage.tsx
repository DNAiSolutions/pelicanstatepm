import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, User, Clock, Mail } from 'lucide-react';
import { useProfileData } from '../hooks/useProfileData';
import { useAuth } from '../context/AuthContext';
import { quoteService, type QuoteRecord } from '../services/quoteService';

import {
  getWorkOrderById,
  getSiteById,
  getPropertyById,
  type QuoteStatus,
} from '../data/pipeline';


type QuoteRow = {
  id: string;
  workRequestId: string;
  requestNumber: string;
  workOrderTitle: string;
  siteName: string;
  propertyName: string | null;
  status: QuoteStatus | string;
  totalAmount: number;
  version: number;
  updatedAt?: string | null;
};

export function QuotesListPage() {
  const navigate = useNavigate();
  const { quotes: mockQuotes, isAdminProfile } = useProfileData();
  const { user } = useAuth();
  const propertyAssignments = user?.propertyAssigned ?? [];
  const propertyKey = propertyAssignments.join('|');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [propertyFilter, setPropertyFilter] = useState<string>('All');
  const [quotesData, setQuotesData] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(isAdminProfile);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminProfile) return;
    if (propertyAssignments.length === 0) {
      setQuotesData([]);
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);
    setError(null);
    quoteService
      .listByProperties(propertyAssignments)
      .then((data) => {
        if (isMounted) setQuotesData(data);
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message || 'Failed to load quotes');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [propertyKey, propertyAssignments, isAdminProfile]);

  const normalizedQuotes: QuoteRow[] = useMemo(() => {
    if (isAdminProfile) {
      return quotesData.map((quote) => ({
        id: quote.id,
        workRequestId: quote.workRequestId,
        requestNumber: quote.requestNumber,
        workOrderTitle: quote.title,
        siteName: quote.siteName,
        propertyName: quote.propertyName,
        status: quote.status,
        totalAmount: quote.totalAmount,
        version: 1,
        updatedAt: quote.updatedAt ?? null,
      }));
    }
    return mockQuotes.map((quote) => {
      const pipelineQuote = quote as typeof quote & { updatedAt?: string };
      const updatedAt = pipelineQuote.updatedAt ?? pipelineQuote.approvedAt ?? pipelineQuote.createdAt;
      const workOrder = getWorkOrderById(quote.workOrderId);
      const site = workOrder ? getSiteById(workOrder.siteId) : null;
      const property = site ? getPropertyById(site.propertyId) : null;
      return {
        id: quote.id,
        workRequestId: quote.workOrderId,
        requestNumber: workOrder?.requestNumber ?? quote.id,
        workOrderTitle: workOrder?.title ?? 'Work Request',
        siteName: site?.name ?? 'Site',
        propertyName: property?.name ?? null,
        status: quote.status,
        totalAmount: quote.totalEstimate,
        version: quote.version,
        updatedAt,
      } satisfies QuoteRow;
    });
  }, [isAdminProfile, mockQuotes, quotesData]);

  const filteredQuotes = useMemo(() => {
    return normalizedQuotes.filter((quote) => {
      const matchesSearch =
        quote.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.workOrderTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.propertyName ?? '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || quote.status === statusFilter;
      const matchesProperty = propertyFilter === 'All' || quote.propertyName === propertyFilter;

      return matchesSearch && matchesStatus && matchesProperty;
    });
  }, [normalizedQuotes, searchTerm, statusFilter, propertyFilter]);

  const showPropertyGuard = isAdminProfile && propertyAssignments.length === 0;

  const summary = useMemo(() => {
    return normalizedQuotes.reduce(
      (acc, quote) => {
        acc.total += 1;
        if (quote.status === 'Draft') acc.draft += 1;
        if (quote.status !== 'Draft') {
          acc.sent += 1;
          acc.sentValue += quote.totalAmount;
        }
        if (quote.status === 'Approved') {
          acc.approved += 1;
          acc.convertedValue += quote.totalAmount;
        }
        return acc;
      },
      { total: 0, draft: 0, sent: 0, approved: 0, sentValue: 0, convertedValue: 0 }
    );
  }, [normalizedQuotes]);

  const statusChips = ['All', 'Draft', 'Submitted', 'Approved', 'Changes Requested'];
  const propertyOptions = ['All', ...Array.from(new Set(normalizedQuotes.map((quote) => quote.propertyName).filter(Boolean)))];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Pelican State Quotes</p>
          <h1 className="text-3xl font-heading font-bold text-neutral-900">Quotes</h1>
        </div>
        <button onClick={() => navigate('/quotes/new')} className="btn-primary px-5 py-2 text-sm">
          New Quote
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(() => {
          const conversionRate = summary.sent ? Math.round((summary.approved / summary.sent) * 100) : 0;
          return [
            { label: 'Overview', value: summary.total, helper: `${summary.draft} drafts • ${summary.approved} approved` },
            {
              label: 'Conversion rate (30d)',
              value: `${conversionRate}%`,
              helper: summary.sent ? `${summary.approved}/${summary.sent} converted` : 'No sent quotes',
            },
            {
              label: 'Sent (30d)',
              value: summary.sent,
              helper: summary.sentValue ? formatCurrency(summary.sentValue) : '$0',
            },
            {
              label: 'Converted (30d)',
              value: summary.approved,
              helper: summary.convertedValue ? formatCurrency(summary.convertedValue) : '$0',
            },
          ];
        })().map((card) => (
          <div key={card.label} className="card p-4 rounded-3xl border border-[var(--border-subtle)] bg-white">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">{card.label}</p>
            <p className="text-3xl font-heading text-[var(--text-body)]">{card.value}</p>
            <p className="text-xs text-[var(--text-muted)]">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-[var(--text-muted)] text-sm">
          <Filter className="w-4 h-4" /> Filtered quotes
          {statusFilter !== 'All' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--brand-sand)] text-xs text-[var(--text-body)]">
              Status: {statusFilter}
            </span>
          )}
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search quotes or work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusChips.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-xs font-medium rounded-full border ${
                  statusFilter === status
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="px-4 py-2 border rounded-full text-sm text-[var(--text-body)]"
          >
            {propertyOptions.map((property) => (
              <option key={property || 'all'} value={property || 'All'}>
                {property || 'All properties'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showPropertyGuard && (
        <div className="border border-dashed border-neutral-300 rounded-2xl p-6 text-center text-neutral-600">
          <p>No property assignments detected for your account.</p>
          <p className="text-sm mt-2">Ask an administrator to assign at least one property to view live quotes.</p>
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-[var(--text-muted)] text-sm">Loading quotes…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--brand-sand)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Quote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Work Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Client / Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredQuotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-[var(--brand-sand)] transition-colors cursor-pointer"
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-body)]">{quote.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[var(--text-body)]">{quote.requestNumber}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">{quote.workOrderTitle}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="text-[var(--text-body)] flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        {quote.propertyName ?? '—'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{quote.siteName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)]">v{quote.version}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text-body)]">
                      {formatCurrency(quote.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 font-medium rounded-full ${
                          quote.status === 'Approved'
                            ? 'bg-green-100 text-green-700'
                            : quote.status === 'Submitted'
                            ? 'bg-blue-100 text-blue-700'
                            : quote.status === 'Rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      {formatDate(quote.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/work-requests/${quote.workRequestId}`);
                        }}
                        className="text-sm text-[#0f2749] hover:underline"
                      >
                        View Work Order
                      </button>
                      <button className="ml-3 text-sm text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1">
                        <Mail className="w-4 h-4" /> Send
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
