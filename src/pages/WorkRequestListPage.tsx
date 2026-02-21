import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Eye, Edit2, Search, Building, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { LeadIntakeModal } from '../components/leads/LeadIntakeModal';
import { useProfileData } from '../hooks/useProfileData';
import { useAuth } from '../context/AuthContext';
import { workRequestService } from '../services/workRequestService';
import { propertyService } from '../services/propertyService';
import type { WorkRequest as SupabaseWorkRequest, Property as SupabaseProperty, WorkRequestStatus } from '../types';

// Import pipeline data helpers
import {
  getSiteById,
  getPropertyById,
  getApprovedQuote,
  type WorkOrderStatus,
} from '../data/pipeline';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function WorkRequestListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { workOrders: mockWorkOrders, properties: mockProperties } = useProfileData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || '');
  const [selectedProperty, setSelectedProperty] = useState<string>(searchParams.get('property') || '');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [showLeadIntake, setShowLeadIntake] = useState(false);
  const { user } = useAuth();
  const isDemoProfile = (user?.email ?? '').toLowerCase() === 'demo@pelicanstate.com';
  const [remoteRequests, setRemoteRequests] = useState<SupabaseWorkRequest[]>([]);
  const [remoteProperties, setRemoteProperties] = useState<SupabaseProperty[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Requested: 'bg-gray-100 text-gray-800',
      Scoped: 'bg-blue-100 text-blue-800',
      AwaitingApproval: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-indigo-100 text-indigo-800',
      Scheduled: 'bg-cyan-100 text-cyan-800',
      InProgress: 'bg-blue-100 text-blue-800',
      Blocked: 'bg-red-100 text-red-800',
      Completed: 'bg-green-100 text-green-800',
      Invoiced: 'bg-purple-100 text-purple-800',
      Paid: 'bg-emerald-100 text-emerald-800',
      Closed: 'bg-gray-100 text-gray-700',
      Intake: 'bg-gray-100 text-gray-800',
      Scoping: 'bg-blue-100 text-blue-800',
      Estimate: 'bg-sky-100 text-sky-800',
      Approval: 'bg-amber-100 text-amber-800',
      Schedule: 'bg-cyan-100 text-cyan-800',
      Progress: 'bg-blue-100 text-blue-800',
      Complete: 'bg-green-100 text-green-800',
      Invoice: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  const demoStatuses: WorkOrderStatus[] = [
    'Requested',
    'Scoped',
    'AwaitingApproval',
    'Approved',
    'Scheduled',
    'InProgress',
    'Blocked',
    'Completed',
    'Invoiced',
    'Paid',
  ];

  const portalStatuses: WorkRequestStatus[] = [
    'Intake',
    'Scoping',
    'Estimate',
    'Approval',
    'Schedule',
    'Progress',
    'Complete',
    'Invoice',
    'Paid',
  ];

  useEffect(() => {
    if (isDemoProfile) return;
    let isMounted = true;
    async function loadRemoteData() {
      try {
        setLoadingRemote(true);
        const [requests, properties] = await Promise.all([
          workRequestService.getWorkRequests(),
          propertyService.getProperties(),
        ]);
        if (!isMounted) return;
        setRemoteRequests(requests as SupabaseWorkRequest[]);
        setRemoteProperties(properties as SupabaseProperty[]);
      } catch (error) {
        console.error('Failed to load work requests', error);
        toast.error('Unable to load work requests');
      } finally {
        if (isMounted) {
          setLoadingRemote(false);
        }
      }
    }
    loadRemoteData();
    return () => {
      isMounted = false;
    };
  }, [isDemoProfile]);

  type RequestRow = {
    id: string;
    requestNumber: string;
    title?: string;
    propertyName?: string;
    siteName?: string;
    priority?: string;
    status: string;
    percentComplete?: number;
    estimatedCost?: number;
    propertyId?: string;
    isHistoric?: boolean;
  };

  const requestRows = useMemo<RequestRow[]>(() => {
    if (isDemoProfile) {
      return mockWorkOrders.map((wo: any) => {
        const site = getSiteById(wo.siteId);
        const property = site ? getPropertyById(site.propertyId) : null;
        const approvedQuote = getApprovedQuote(wo.id);
        return {
          id: wo.id,
          requestNumber: wo.requestNumber,
          title: wo.title,
          propertyName: property?.name,
          siteName: site?.name,
          priority: wo.priority,
          status: wo.status,
          percentComplete: wo.percentComplete,
          estimatedCost: wo.estimatedCost ?? approvedQuote?.totalEstimate,
          propertyId: property?.id,
          isHistoric: site?.isHistoric,
        };
      });
    }
    return remoteRequests.map((request) => {
      const intakePayload = (request.intake_payload ?? {}) as Record<string, any>;
      const progressValue = typeof intakePayload.progress === 'number' ? intakePayload.progress : 0;
      return {
        id: request.id,
        requestNumber: request.request_number,
        title: request.title || request.description || 'Untitled request',
        propertyName: request.property,
        siteName: request.property,
        priority: request.priority || 'Medium',
        status: request.status,
        percentComplete: progressValue,
        estimatedCost: request.estimated_cost ? Number(request.estimated_cost) : undefined,
        propertyId: request.property_id,
      };
    });
  }, [isDemoProfile, mockWorkOrders, remoteRequests]);

  const filteredRequests = useMemo(() => {
    return requestRows.filter((row) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        row.requestNumber.toLowerCase().includes(term) ||
        (row.title ?? '').toLowerCase().includes(term) ||
        (row.propertyName?.toLowerCase().includes(term) ?? false) ||
        (row.siteName?.toLowerCase().includes(term) ?? false);
      const matchesStatus = !selectedStatus || row.status === selectedStatus;
      const matchesProperty = !selectedProperty || row.propertyId === selectedProperty;
      const matchesPriority =
        !selectedPriority || (row.priority ?? '').toLowerCase() === selectedPriority.toLowerCase();
      return matchesSearch && matchesStatus && matchesProperty && matchesPriority;
    });
  }, [requestRows, searchTerm, selectedStatus, selectedProperty, selectedPriority]);

  const propertyOptions = isDemoProfile ? mockProperties : remoteProperties;
  const statusOptions = isDemoProfile ? demoStatuses : portalStatuses;
  const statusFilters = ['All', ...statusOptions];

  const stats = useMemo(() => {
    const activeStatuses = isDemoProfile
      ? ['InProgress', 'Scheduled', 'AwaitingApproval']
      : ['Scoping', 'Estimate', 'Approval', 'Schedule', 'Progress'];
    const completedStatuses = isDemoProfile
      ? ['Completed', 'Invoiced', 'Paid']
      : ['Complete', 'Invoice', 'Paid'];

    const total = filteredRequests.length;
    const inProgress = filteredRequests.filter((row) => activeStatuses.includes(row.status)).length;
    const completed = filteredRequests.filter((row) => completedStatuses.includes(row.status)).length;
    const totalValue = filteredRequests.reduce((sum, row) => sum + (row.estimatedCost || 0), 0);
    return { total, inProgress, completed, totalValue };
  }, [filteredRequests, isDemoProfile]);

  const blockedCount = useMemo(
    () => filteredRequests.filter((row) => row.status === 'Blocked').length,
    [filteredRequests]
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Operations</p>
          <h1 className="text-3xl font-heading font-semibold text-[var(--text-body)]">Requests</h1>
          <p className="text-sm text-[var(--text-muted)]">Live intake + dispatch board</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowLeadIntake(true)}
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Capture lead
          </button>
          <button
            type="button"
            onClick={() => navigate('/work-requests/new')}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> New request
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[{
          label: 'Requests in queue',
          value: stats.total,
          tone: 'border-slate-200 bg-slate-50 text-slate-800',
          helper: 'Across Pelican State'
        },
        {
          label: 'Active + scheduled',
          value: stats.inProgress,
          tone: 'border-sky-200 bg-sky-50 text-sky-800',
          helper: 'Moving through teams'
        },
        {
          label: 'Completed this month',
          value: stats.completed,
          tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
          helper: 'Ready for invoicing'
        },
        {
          label: 'Blocked items',
          value: blockedCount,
          tone: 'border-rose-200 bg-rose-50 text-rose-800',
          helper: 'Need intervention'
        }].map((card) => (
          <div key={card.label} className={`card p-5 rounded-3xl ${card.tone}`}>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--text-muted)]">{card.label}</p>
            <p className="text-3xl font-heading mt-2">{card.value}</p>
            <p className="text-xs text-[var(--text-muted)]">{card.helper}</p>
          </div>
        ))}
      </section>

      <section className="card p-6 space-y-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search request number, scope, or site"
              className="pl-10 pr-4 py-2 w-full border rounded-full text-sm"
            />
          </div>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-4 py-2 border rounded-full text-sm text-[var(--text-body)]"
          >
            <option value="">All properties</option>
            {propertyOptions.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 border rounded-full text-sm text-[var(--text-body)]"
          >
            <option value="">All priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((status) => {
              const isActive = (status === 'All' && !selectedStatus) || selectedStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                onClick={() => setSelectedStatus(status === 'All' ? '' : status)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  isActive
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                    : 'text-[var(--text-muted)] hover:border-[var(--brand-primary)]'
                }`}
              >
                {status === 'All' ? 'All statuses' : status.replace(/([A-Z])/g, ' $1').trim()}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Requests</p>
            <h2 className="text-xl font-heading font-semibold">Live intake tracker</h2>
          </div>
          <p className="text-sm text-[var(--text-muted)]">{filteredRequests.length} showing</p>
        </div>
        {!isDemoProfile && loadingRemote ? (
          <div className="px-6 py-12 text-center text-[var(--text-muted)]">Loading requests…</div>
        ) : filteredRequests.length === 0 ? (
          <div className="px-6 py-12 text-center text-[var(--text-muted)]">
            <p>No requests match the filters.</p>
            <button
              onClick={() => navigate('/work-requests/new')}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]"
            >
              <Plus className="w-4 h-4" /> Create the first request
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="text-left px-6 py-3">Request</th>
                  <th className="text-left px-6 py-3">Location</th>
                  <th className="text-left px-6 py-3">Priority</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Progress</th>
                  <th className="text-right px-6 py-3">Est. Value</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[var(--border-subtle)] hover:bg-[var(--brand-sand)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/work-requests/${row.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[var(--text-body)]">{row.requestNumber}</p>
                          {row.isHistoric && (
                            <span className="text-[10px] uppercase tracking-[0.2em] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5">
                              Historic
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] truncate max-w-xs">{row.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <Building className="w-4 h-4" />
                        <div>
                          <p className="text-sm text-[var(--text-body)]">{row.siteName || row.propertyName || '—'}</p>
                          <p className="text-xs">{row.propertyName || 'Property TBD'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(row.priority || 'Medium')}`}>
                        {row.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {row.status === 'Blocked' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(row.status)}`}>
                          {row.status.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-neutral-200 h-1.5 w-24 rounded-full">
                          <div
                            className="bg-[var(--brand-primary)] h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, row.percentComplete ?? 0))}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{row.percentComplete ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-semibold text-[var(--text-body)]">
                        {row.estimatedCost ? formatCurrency(row.estimatedCost) : 'TBD'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/work-requests/${row.id}`)}
                          className="p-2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-sand)]"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/work-requests/${row.id}/edit`)}
                          className="p-2 text-[var(--text-muted)] hover:text-sky-600 hover:bg-[var(--brand-sand)]"
                          title="Edit request"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-[var(--text-muted)]">Total requests</p>
          <p className="text-2xl font-heading">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-muted)]">Active pipeline value</p>
          <p className="text-2xl font-heading">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-muted)]">In progress</p>
          <p className="text-2xl font-heading text-sky-700">{stats.inProgress}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-muted)]">Completed / invoiced</p>
          <p className="text-2xl font-heading text-emerald-600">{stats.completed}</p>
        </div>
      </section>

      {showLeadIntake && (
        <LeadIntakeModal
          open={showLeadIntake}
          onClose={() => setShowLeadIntake(false)}
          onCreated={() => toast.success('Lead captured and added to pipeline')}
        />
      )}
    </div>
  );
}
