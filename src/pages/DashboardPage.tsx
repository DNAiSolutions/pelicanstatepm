import { useState, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  ClipboardList,
  FileText,
  Briefcase,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Receipt,
} from 'lucide-react';
import { useProfileData } from '../hooks/useProfileData';
import { useAdminDashboardData } from '../hooks/useAdminDashboardData';
import type {
  DashboardWorkRequest,
  DashboardInvoice,
  DashboardQuote,
} from '../services/adminDataService';
import toast from 'react-hot-toast';
import { LeadIntakeModal } from '../components/leads/LeadIntakeModal';
import { useAuth } from '../context/AuthContext';

// Local UI types standardized to snake_case
type DisplayWorkOrder = DashboardWorkRequest;
type DisplayInvoice = DashboardInvoice;
type DisplayQuote = DashboardQuote;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

type SummaryCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  badgeLabel?: string;
  badgeTone?: 'blue' | 'green' | 'amber' | 'red';
};

const badgeClasses: Record<NonNullable<SummaryCardProps['badgeTone']>, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
};

function SummaryCard({ title, value, subtitle, icon, badgeLabel, badgeTone = 'blue' }: SummaryCardProps) {
  return (
    <div className="bg-white border border-neutral-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-[#0f2749]/10 text-[#0f2749] rounded">
          {icon}
        </div>
        {badgeLabel && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClasses[badgeTone]}`}>
            {badgeLabel}
          </span>
        )}
      </div>
      <h3 className="text-sm text-neutral-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const profileData = useProfileData();
  const { properties } = profileData;
  const propertyAssignments: string[] = (user as any)?.property_assigned ?? [];
  const adminData = useAdminDashboardData(true, propertyAssignments);
  
  const [showLeadIntake, setShowLeadIntake] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'inProgress' | 'completed'>('all');

  const isLiveProfile = true;
  const projectList = adminData.projects;

  const displayWorkOrders: DisplayWorkOrder[] = useMemo(() => {
    return isLiveProfile ? adminData.workRequests : profileData.workOrders.map((wo: any) => ({
      id: wo.id,
      request_number: wo.request_number,
      title: wo.title || 'Untitled Request',
      status: wo.status as any,
      raw_status: wo.status,
      priority: wo.priority,
      property_id: wo.property_id,
      property_name: properties.find(p => p.id === wo.property_id)?.name || null,
      estimated_cost: wo.estimated_cost
    }));
  }, [isLiveProfile, adminData.workRequests, profileData.workOrders, properties]);

  const displayInvoices: DisplayInvoice[] = useMemo(() => {
    return isLiveProfile ? adminData.invoices : profileData.invoices.map(inv => ({
      id: inv.id || '',
      invoice_number: inv.invoice_number || 'INV-TEMP',
      total_amount: inv.total_amount,
      status: (inv as any).status,
      submitted_at: inv.submitted_at,
      paid_at: inv.paid_at
    }));
  }, [isLiveProfile, adminData.invoices, profileData.invoices]);

  const quotesForDisplay: DisplayQuote[] = useMemo(() => {
    return isLiveProfile ? adminData.quotes : []; // Quotes transition
  }, [adminData.quotes, isLiveProfile]);

  // quotesForDisplay is already handled above


  const requestSummary = useMemo(() => {
    return displayWorkOrders.reduce(
      (acc, wo) => {
        const normalized = wo.status.toLowerCase().replace(/\s+/g, '');
        const amount = wo.estimated_cost ?? 0;
        acc.total += 1;
        if (['inprogress', 'progress', 'scheduled'].includes(normalized)) {
          acc.in_progress += 1;
          acc.active_value += amount;
        } else if (['awaitingapproval', 'approval', 'estimate'].includes(normalized)) {
          acc.awaiting_approval += 1;
          acc.active_value += amount;
        } else if (normalized === 'blocked') {
          acc.blocked += 1;
        } else if (['complete', 'completed'].includes(normalized)) {
          acc.completed += 1;
        }
        return acc;
      },
      {
        total: 0,
        active_value: 0,
        in_progress: 0,
        awaiting_approval: 0,
        blocked: 0,
        completed: 0,
      }
    );
  }, [displayWorkOrders]);

  const quoteSummary = useMemo(() => {
    return quotesForDisplay.reduce(
      (acc, quote) => {
        acc.total += 1;
        switch (quote.status) {
          case 'Draft':
            acc.draft += 1;
            break;
          case 'Submitted':
            acc.submitted += 1;
            break;
          case 'Approved':
            acc.approved += 1;
            break;
          default:
            acc.other += 1;
            break;
        }
        return acc;
      },
      { total: 0, draft: 0, submitted: 0, approved: 0, other: 0 }
    );
  }, [quotesForDisplay]);

  const jobSummary = useMemo(() => {
    return projectList.reduce(
      (acc: { total: number; active: number; completed: number; onHold: number }, project: any) => {
        acc.total += 1;
        const status = project.status ?? '';
        if (['Planning', 'PreConstruction', 'Active', 'Progress', 'InProgress'].includes(status)) {
          acc.active += 1;
        } else if (['OnHold', 'Blocked'].includes(status)) {
          acc.onHold += 1;
        } else if (['Closeout', 'Completed'].includes(status)) {
          acc.completed += 1;
        }
        return acc;
      },
      { total: 0, active: 0, completed: 0, onHold: 0 }
    );
  }, [projectList]);

  const invoiceSummary = useMemo(() => {
    return displayInvoices.reduce(
      (acc, invoice) => {
        acc.total += 1;
        switch (invoice.status) {
          case 'Draft':
            acc.draft += 1;
            break;
          case 'Submitted':
          case 'Approved':
            acc.pending += 1;
            break;
          case 'Paid':
            acc.paid += 1;
            break;
          default:
            break;
        }
        acc.total_value += invoice.total_amount;
        return acc;
      },
      { total: 0, draft: 0, pending: 0, paid: 0, total_value: 0 }
    );
  }, [displayInvoices]);

  const needsAttentionCount = requestSummary.blocked + requestSummary.awaiting_approval;

  const recentQuotes = useMemo(() => quotesForDisplay.slice(0, 5), [quotesForDisplay]);

  const propertyNameById = useMemo(() => {
    const map = new Map<string, string>();
    const source = isLiveProfile ? adminData.properties : properties;
    source.forEach((property) => {
      map.set(property.id, property.name);
    });
    return map;
  }, [adminData.properties, properties, isLiveProfile]);

  const jobRows = useMemo(
    () =>
      projectList.slice(0, 5).map((project: any) => ({
        id: project.id,
        name: project.name,
        clientName: project.client_name,
        propertyName: project.property_id ? propertyNameById.get(project.property_id) ?? '' : '',
        status: project.status,
        budget: Number(project.total_budget ?? 0),
        spent: Number(project.spent_budget ?? 0),
      })),
    [projectList, propertyNameById]
  );

  const recentInvoices = useMemo(() => displayInvoices.slice(0, 5), [displayInvoices]);

  const filteredWorkOrders = useMemo(() => {
    let orders = [...displayWorkOrders];
    if (statusFilter === 'inProgress') {
      orders = orders.filter((wo) => ['InProgress', 'Scheduled'].includes(wo.status));
    } else if (statusFilter === 'completed') {
      orders = orders.filter((wo) => wo.status === 'Completed');
    }
    return orders.slice(0, 6);
  }, [statusFilter, displayWorkOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Paid':
        return 'bg-green-100 text-green-700';
      case 'InProgress':
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'AwaitingApproval':
        return 'bg-yellow-100 text-yellow-700';
      case 'Blocked':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-700';
      case 'High':
        return 'bg-orange-100 text-orange-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLiveProfile && adminData.loading) {
    return (
      <div className="p-8 text-sm text-neutral-600">
        Loading live facility data from Supabase...
      </div>
    );
  }

  if (isLiveProfile && adminData.error) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-sm text-red-600">{adminData.error}</p>
        <button
          onClick={adminData.reload}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-neutral-300"
        >
          Retry Loading Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {profile?.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 px-4 py-3">
          Your request for staff access is pending approval. You currently have vendor-level visibility.
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-heading font-bold text-neutral-900">
            Operations Dashboard
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Pelican State facilities management across all active campuses and vendor partners
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setShowLeadIntake(true)}
            className="flex items-center gap-2 border border-neutral-300 text-neutral-700 px-4 py-2.5 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Intake
          </button>
          <button
            onClick={() => navigate('/work-requests/new')}
            className="flex items-center gap-2 bg-[#0f2749] hover:bg-[#0f2749]/90 text-white px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Work Request
          </button>
        </div>
      </div>

      {/* Snapshot row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Requests"
          value={`${requestSummary.total}`}
          subtitle={`${requestSummary.in_progress} active • ${requestSummary.awaiting_approval} pending`}
          icon={<ClipboardList className="w-5 h-5" />}
          badgeLabel={`${requestSummary.blocked} blocked`}
          badgeTone="red"
        />
        <SummaryCard
          title="Quotes"
          value={`${quoteSummary.total}`}
          subtitle={`${quoteSummary.approved} approved • ${quoteSummary.submitted} submitted`}
          icon={<FileText className="w-5 h-5" />}
          badgeLabel={`${quoteSummary.draft} drafts`}
          badgeTone="amber"
        />
        <SummaryCard
          title="Jobs"
          value={`${jobSummary.active}`}
          subtitle={`${jobSummary.total} total • ${jobSummary.completed} completed`}
          icon={<Briefcase className="w-5 h-5" />}
          badgeLabel={`${jobSummary.onHold} on hold`}
          badgeTone="blue"
        />
        <SummaryCard
          title="Invoices"
          value={`$${invoiceSummary.total_value.toLocaleString()}`}
          subtitle={`${invoiceSummary.pending} pending • ${invoiceSummary.paid} paid`}
          icon={<Receipt className="w-5 h-5" />}
          badgeLabel={`${invoiceSummary.draft} drafts`}
          badgeTone="green"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Requests */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Requests</h3>
              <p className="text-xs text-neutral-500">Latest service requests across your properties</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {(['all', 'inProgress', 'completed'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setStatusFilter(filterKey)}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      statusFilter === filterKey
                        ? 'bg-[#0f2749] text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {filterKey === 'all'
                      ? 'All'
                      : filterKey === 'inProgress'
                      ? 'In Progress'
                      : 'Completed'}
                  </button>
                ))}
              </div>
            <button onClick={() => navigate('/work-requests')} className="text-sm text-[#0f2749] hover:underline">
              View All
            </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">Request</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">Property</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">Priority</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600">Est. Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkOrders.map((wo) => (
                  <tr
                    key={wo.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/work-requests/${wo.id}`)}
                  >
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-neutral-900">{wo.request_number}</p>
                      <p className="text-xs text-neutral-500 truncate max-w-xs">{wo.title}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-900">{wo.property_name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 font-medium ${getPriorityColor(wo.priority || 'Medium')}`}>
                        {wo.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 font-medium ${getStatusColor(wo.status)}`}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-neutral-900">
                      {wo.estimated_cost ? formatCurrency(wo.estimated_cost) : 'TBD'}
                    </td>
                  </tr>
                ))}
                {filteredWorkOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-neutral-500">
                      No requests available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quotes */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Quotes</h3>
              <p className="text-xs text-neutral-500">Active quotes awaiting client approval</p>
            </div>
            <button onClick={() => navigate('/quotes')} className="text-sm text-[#0f2749] hover:underline">
              View All
            </button>
          </div>

          {recentQuotes.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">No quotes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between p-3 border border-neutral-100 hover:border-[#0f2749]/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/work-requests/${quote.workRequestId}`)}
                >
                  <div>
                    <p className="font-medium text-neutral-900">{quote.id}</p>
                    <p className="text-xs text-neutral-500">
                      {quote.title} • {quote.propertyName || quote.siteName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">{formatCurrency(quote.totalAmount)}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        quote.status === 'Approved'
                          ? 'bg-green-100 text-green-700'
                          : quote.status === 'Submitted'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {quote.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Jobs */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Jobs</h3>
              <p className="text-xs text-neutral-500">Active jobs across your portfolio</p>
            </div>
            <button onClick={() => navigate('/projects')} className="text-sm text-[#0f2749] hover:underline">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">Job</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">Client</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600">Budget</th>
                </tr>
              </thead>
              <tbody>
                {jobRows.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${job.id}`)}
                  >
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-neutral-900">{job.name}</p>
                      <p className="text-xs text-neutral-500">{job.propertyName || '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-900">{job.clientName}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="text-sm font-medium text-neutral-900">{formatCurrency(job.budget)}</p>
                      <p className="text-xs text-neutral-500">Spent {formatCurrency(job.spent)}</p>
                    </td>
                  </tr>
                ))}
                {jobRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-neutral-500">
                      No jobs available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Invoices</h3>
              <p className="text-xs text-neutral-500">Recent billing activity</p>
            </div>
            <button onClick={() => navigate('/invoices')} className="text-sm text-[#0f2749] hover:underline">
              View All
            </button>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 border border-neutral-100 hover:border-[#0f2749]/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <div>
                    <p className="font-medium text-neutral-900">{inv.invoice_number}</p>
                    <p className="text-xs text-neutral-500">
                      {inv.paid_at
                        ? `Paid ${new Date(inv.paid_at).toLocaleDateString()}`
                        : inv.submitted_at
                        ? `Submitted ${new Date(inv.submitted_at).toLocaleDateString()}`
                        : 'Draft'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">{formatCurrency(inv.total_amount)}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        inv.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : inv.status === 'Approved'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Needs Attention */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900">Needs Attention</h3>
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 font-medium">{needsAttentionCount}</span>
          </div>

          <div className="space-y-3">
            {displayWorkOrders
              .filter((wo) => wo.status === 'Blocked')
              .map((wo) => (
                <div
                  key={wo.id}
                  className="flex items-start gap-3 p-3 border-l-4 border-red-500 bg-red-50 cursor-pointer"
                  onClick={() => navigate(`/work-requests/${wo.id}`)}
                >
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">{wo.request_number}</p>
                    <p className="text-xs text-neutral-600">{wo.title}</p>
                  </div>
                </div>
              ))}

            {displayWorkOrders
              .filter((wo) => wo.status === 'AwaitingApproval')
              .slice(0, 3)
              .map((wo) => (
                <div
                  key={wo.id}
                  className="flex items-start gap-3 p-3 border-l-4 border-yellow-500 bg-yellow-50 cursor-pointer"
                  onClick={() => navigate(`/work-requests/${wo.id}`)}
                >
                  <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">{wo.request_number}</p>
                    <p className="text-xs text-neutral-600">Quote pending approval</p>
                  </div>
                </div>
              ))}

            {needsAttentionCount === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">All clear - no blocked items</p>
              </div>
            )}
          </div>
        </div>

        {/* Properties */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900">Properties</h3>
          </div>

          {(isLiveProfile ? adminData.properties : properties).length === 0 ? (
            <div className="text-sm text-neutral-500">No properties yet.</div>
          ) : (
            <div className="space-y-4">
              {(isLiveProfile ? adminData.properties : properties).map((property) => {
                const propertyWorkOrders = displayWorkOrders.filter((wo) => wo.property_id === property.id);
                const activeCount = propertyWorkOrders.filter((wo) =>
                  ['InProgress', 'Scheduled', 'AwaitingApproval'].includes(wo.status)
                ).length;
                return (
                  <div
                    key={property.id}
                    className="p-3 border border-neutral-100 hover:border-[#0f2749]/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/work-requests?property=${property.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-neutral-400" />
                        <span className="font-medium text-neutral-900">{property.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 ${getPriorityColor(property.priority || 'Medium')}`}>
                        {property.priority || 'Medium'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{propertyWorkOrders.length} total requests</span>
                      <span className="text-[#0f2749] font-medium">{activeCount} active</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showLeadIntake && (
        <LeadIntakeModal
          open={showLeadIntake}
          onClose={() => setShowLeadIntake(false)}
          onCreated={() => toast.success('Lead captured and moved to New stage')}
        />
      )}
    </div>
  );
}
