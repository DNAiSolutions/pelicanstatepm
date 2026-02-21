import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Edit2,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Building,
  AlertTriangle,
  Lock,
  Play,
  Camera,
  ClipboardCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import from pipeline mock data
import {
  mockVendors,
  getWorkOrderById,
  getQuotesByWorkOrderId,
  getApprovedQuote,
  getWorkLogsByWorkOrderId,
  getSiteById,
  getProjectById,
  getUserById,
  getVendorById,
  getPropertyById,
  canSchedule,
  canMarkComplete,
  canGenerateInvoice,
  type WorkOrder,
  type Quote,
  type WorkLog,
  type WorkOrderStatus,
} from '../data/pipeline';
import { workRequestService } from '../services/workRequestService';
import { contactService } from '../services/contactService';
import type { WorkRequest, Contact } from '../types';

import { HistoricDocumentation, type HistoricDoc } from '../components/HistoricDocumentation';

type TabType = 'overview' | 'timeline' | 'quotes' | 'schedule' | 'completion' | 'invoice';

const STATUS_FLOW: WorkOrderStatus[] = [
  'Requested',
  'Scoped',
  'AwaitingApproval',
  'Approved',
  'Scheduled',
  'InProgress',
  'Completed',
  'Invoiced',
  'Paid',
  'Closed',
];

export function WorkRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showHistoricDocs, setShowHistoricDocs] = useState(false);
  const [supabaseRequest, setSupabaseRequest] = useState<WorkRequest | null>(null);
  const [supabaseContact, setSupabaseContact] = useState<Contact | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadSupabaseRequest = async (requestId: string) => {
    const request = await workRequestService.getWorkRequest(requestId);
    setSupabaseRequest(request);
    if (request?.client_contact_id) {
      try {
        const contact = await contactService.getById(request.client_contact_id);
        if (contact) {
          setSupabaseContact(contact);
        }
      } catch (error) {
        console.warn('Unable to load request contact', error);
      }
    }
  };

  const loadData = async () => {
    if (!id) {
      navigate('/work-requests');
      return;
    }

    try {
      setIsLoading(true);
      setSupabaseRequest(null);
      setSupabaseContact(null);
      const wo = getWorkOrderById(id);
      if (wo) {
        setWorkOrder(wo);
        setQuotes(getQuotesByWorkOrderId(id));
        setWorkLogs(getWorkLogsByWorkOrderId(id));
      } else {
        setWorkOrder(null);
        setQuotes([]);
        setWorkLogs([]);
        await loadSupabaseRequest(id);
      }
    } catch (error) {
      console.error('Failed to load:', error);
      toast.error('Failed to load work request');
      navigate('/work-requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveHistoricDocs = async (_docs: HistoricDoc) => {
    try {
      toast.success('Historic documentation saved');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save documentation');
    }
  };

  // Get related data
  const site = workOrder ? getSiteById(workOrder.siteId) : null;
  const project = workOrder ? getProjectById(workOrder.projectId) : null;
  const property = site ? getPropertyById(site.propertyId) : null;
  const requestedBy = workOrder ? getUserById(workOrder.requestedById) : null;
  const assignedVendor = workOrder?.assignedVendorId ? getVendorById(workOrder.assignedVendorId) : null;
  const approvedQuote = workOrder ? getApprovedQuote(workOrder.id) : null;

  // Pipeline checks
  const scheduleCheck = workOrder ? canSchedule(workOrder.id) : { allowed: false, reason: 'No work order' };
  const completionCheck = workOrder ? canMarkComplete(workOrder.id) : { allowed: false, reason: 'No work order' };
  const invoiceCheck = workOrder ? canGenerateInvoice(workOrder.id) : { allowed: false, reason: 'No work order' };

  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case 'Completed':
      case 'Paid':
      case 'Closed':
        return 'bg-green-100 text-green-800';
      case 'InProgress':
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'AwaitingApproval':
        return 'bg-yellow-100 text-yellow-800';
      case 'Blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: WorkOrderStatus) => {
    switch (status) {
      case 'Completed':
      case 'Paid':
      case 'Closed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'InProgress':
      case 'Scheduled':
        return <Play className="w-5 h-5 text-blue-600" />;
      case 'AwaitingApproval':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Blocked':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'delay':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'scheduleUpdate':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'completion':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'statusChange':
        return <Play className="w-4 h-4 text-gray-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; locked?: boolean; lockReason?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'quotes', label: 'Quotes', icon: <DollarSign className="w-4 h-4" /> },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: <Calendar className="w-4 h-4" />,
      locked: !scheduleCheck.allowed,
      lockReason: scheduleCheck.reason,
    },
    {
      id: 'completion',
      label: 'Completion',
      icon: <ClipboardCheck className="w-4 h-4" />,
      locked: !workOrder || !['InProgress', 'Scheduled', 'Completed'].includes(workOrder.status),
      lockReason: 'Work must be in progress before marking complete',
    },
    {
      id: 'invoice',
      label: 'Invoice',
      icon: <FileText className="w-4 h-4" />,
      locked: !invoiceCheck.allowed,
      lockReason: invoiceCheck.reason,
    },
  ];

  const handleApproveQuote = (quoteId: string) => {
    setQuotes((prev) =>
      prev.map((quote) => {
        if (quote.id === quoteId) {
          return {
            ...quote,
            status: 'Approved',
            approvedAt: new Date().toISOString(),
          };
        }
        if (quote.status === 'Approved') {
          return { ...quote, status: 'Superseded' };
        }
        return quote;
      })
    );
    setWorkOrder((prev) => (prev ? { ...prev, status: 'Approved', approvedQuoteId: quoteId } : prev));
    toast.success('Quote approved (mock)');
  };

  const handleRequestQuoteChanges = (quoteId: string) => {
    setQuotes((prev) =>
      prev.map((quote) =>
        quote.id === quoteId
          ? {
              ...quote,
              status: 'Rejected',
            }
          : quote
      )
    );
    toast.success('Change request recorded (mock)');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0f2749]/20 border-t-[#0f2749] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading work order...</p>
        </div>
      </div>
    );
  }

  if (supabaseRequest) {
    return (
      <SupabaseRequestDetails
        request={supabaseRequest}
        contact={supabaseContact || undefined}
        onBack={() => navigate('/work-requests')}
      />
    );
  }

  if (!workOrder) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-600 mb-4">Work order not found</p>
        <button onClick={() => navigate('/work-requests')} className="btn-primary">
          Back to Work Requests
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/work-requests')}
          className="flex items-center gap-2 text-[#0f2749] hover:text-[#0f2749]/80 mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Work Requests
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-heading font-bold text-neutral-900">
                {workOrder.requestNumber}
              </h1>
              <span className={`px-3 py-1 text-sm font-medium ${getStatusColor(workOrder.status)}`}>
                {workOrder.status}
              </span>
              {site?.isHistoric && (
                <span className="px-3 py-1 text-sm font-medium bg-amber-100 text-amber-800">
                  Historic Site
                </span>
              )}
            </div>
            <p className="text-xl text-neutral-700">{workOrder.title}</p>
            <p className="text-neutral-500 mt-1">
              {site?.name} - {property?.name}
            </p>
          </div>
          <button
            onClick={() => navigate(`/work-requests/${workOrder.id}/edit`)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </div>

        {/* Pipeline Progress */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.slice(0, 7).map((status, index) => {
              const isCurrent = workOrder.status === status;
              const isPast = STATUS_FLOW.indexOf(workOrder.status) > index;
              return (
                <div key={status} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
                      isCurrent
                        ? 'bg-[#0f2749] text-white'
                        : isPast
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isPast ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <span
                    className={`ml-2 text-xs ${
                      isCurrent ? 'text-[#0f2749] font-medium' : isPast ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {status.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  {index < 6 && (
                    <div
                      className={`w-8 h-0.5 mx-2 ${isPast ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.locked) {
                  toast.error(tab.lockReason || 'This tab is locked');
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#0f2749] text-[#0f2749]'
                  : tab.locked
                  ? 'border-transparent text-neutral-400 cursor-not-allowed'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.locked && <Lock className="w-3 h-3" />}
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Details</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Description</p>
                    <p className="text-neutral-900">{workOrder.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Location Detail</p>
                    <p className="text-neutral-900">{workOrder.locationDetail}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-600">Priority</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-sm font-medium ${
                          workOrder.priority === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : workOrder.priority === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : workOrder.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {workOrder.priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Category</p>
                      <p className="text-lg font-medium text-neutral-900">{workOrder.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">Requested Date</p>
                      <p className="text-lg font-medium text-neutral-900">
                        {new Date(workOrder.requestedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">% Complete</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 h-2 rounded-full">
                          <div
                            className="bg-[#0f2749] h-2 rounded-full"
                            style={{ width: `${workOrder.percentComplete}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{workOrder.percentComplete}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Site Info */}
              {site?.isHistoric && site.historicNotes && (
                <div className="card p-6 border-l-4 border-amber-500">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-neutral-900 mb-1">Historic Site Notice</h3>
                      <p className="text-neutral-700">{site.historicNotes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4">
                  <p className="text-sm text-neutral-600 mb-1">Estimated Cost</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    ${workOrder.estimatedCost?.toLocaleString() || 'TBD'}
                  </p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-neutral-600 mb-1">Approved Quote</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {approvedQuote ? `$${approvedQuote.totalEstimate.toLocaleString()}` : 'None'}
                  </p>
                  {approvedQuote?.notToExceed && (
                    <p className="text-sm text-neutral-500">NTE: ${approvedQuote.notToExceed.toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="card p-6">
              <h2 className="text-xl font-heading font-bold text-neutral-900 mb-6">Activity Timeline</h2>
              {workLogs.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No activity recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {workLogs.map((log) => (
                    <div key={log.id} className="flex gap-4 pb-4 border-b border-neutral-100 last:border-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                        {getLogTypeIcon(log.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-neutral-900">{log.message}</p>
                            <p className="text-sm text-neutral-500 mt-1">
                              {log.createdByName} - {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              log.type === 'approval'
                                ? 'bg-green-100 text-green-700'
                                : log.type === 'delay'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {log.type}
                          </span>
                        </div>
                        {log.attachments && log.attachments.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {log.attachments.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[#0f2749] hover:underline flex items-center gap-1"
                              >
                                <Camera className="w-3 h-3" />
                                Attachment {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quotes Tab */}
          {activeTab === 'quotes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-neutral-900">Quotes</h2>
                <button
                  onClick={() => navigate(`/quotes/new/${workOrder.id}`)}
                  className="btn-primary text-sm"
                >
                  New Quote
                </button>
              </div>

              {quotes.length === 0 ? (
                <div className="card p-8 text-center">
                  <DollarSign className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500 mb-4">No quotes created yet.</p>
                  <button
                    onClick={() => navigate(`/quotes/new/${workOrder.id}`)}
                    className="btn-primary"
                  >
                    Create First Quote
                  </button>
                </div>
              ) : (
                quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className={`card p-6 ${quote.status === 'Approved' ? 'border-l-4 border-green-500' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-neutral-900">Quote v{quote.version}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
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
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                          Created {new Date(quote.createdAt).toLocaleDateString()}
                          {quote.approvedAt && ` - Approved ${new Date(quote.approvedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-neutral-900">
                          ${quote.totalEstimate.toLocaleString()}
                        </p>
                        {quote.notToExceed && (
                          <p className="text-sm text-neutral-500">NTE: ${quote.notToExceed.toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <table className="w-full text-sm">
                      <thead className="border-b border-neutral-200">
                        <tr>
                          <th className="text-left py-2 font-medium text-neutral-600">Description</th>
                          <th className="text-left py-2 font-medium text-neutral-600">Labor Class</th>
                          <th className="text-right py-2 font-medium text-neutral-600">Qty</th>
                          <th className="text-right py-2 font-medium text-neutral-600">Unit</th>
                          <th className="text-right py-2 font-medium text-neutral-600">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {quote.lineItems.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 text-neutral-900">{item.description}</td>
                            <td className="py-2 text-neutral-600">{item.laborClass}</td>
                            <td className="py-2 text-right text-neutral-900">{item.quantity}</td>
                            <td className="py-2 text-right text-neutral-600">${item.unitCost}</td>
                            <td className="py-2 text-right font-medium text-neutral-900">
                              ${item.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {quote.fundingCode && (
                      <p className="mt-4 text-sm text-neutral-500">Funding Code: {quote.fundingCode}</p>
                    )}

                    {quote.status === 'Submitted' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          className="btn-primary text-sm"
                          onClick={() => handleApproveQuote(quote.id)}
                        >
                          Approve Quote
                        </button>
                        <button
                          className="btn-secondary text-sm"
                          onClick={() => handleRequestQuoteChanges(quote.id)}
                        >
                          Request Changes
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && scheduleCheck.allowed && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Schedule Work</h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      defaultValue={workOrder.targetStartDate}
                      className="w-full px-3 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2749]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
                    <input
                      type="date"
                      defaultValue={workOrder.targetEndDate}
                      className="w-full px-3 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2749]"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Assigned Vendor</label>
                  <select
                    defaultValue={workOrder.assignedVendorId || ''}
                    className="w-full px-3 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2749]"
                  >
                    <option value="">Select a vendor...</option>
                    {mockVendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.isPrime && '(Prime)'}
                      </option>
                    ))}
                  </select>
                </div>

                <button className="btn-primary">Save Schedule</button>
              </div>

              {workOrder.targetStartDate && (
                <div className="card p-6">
                  <h3 className="font-bold text-neutral-900 mb-4">Current Schedule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-600">Start Date</p>
                      <p className="text-lg font-medium">
                        {new Date(workOrder.targetStartDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600">End Date</p>
                      <p className="text-lg font-medium">
                        {workOrder.targetEndDate
                          ? new Date(workOrder.targetEndDate).toLocaleDateString()
                          : 'Not set'}
                      </p>
                    </div>
                    {assignedVendor && (
                      <div className="col-span-2">
                        <p className="text-sm text-neutral-600">Assigned To</p>
                        <p className="text-lg font-medium">{assignedVendor.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completion Tab */}
          {activeTab === 'completion' && (
            <div className="space-y-6">
              {/* Completion Checklist */}
              <div className="card p-6">
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Completion Checklist</h2>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      checked={workOrder.completionChecklistDone}
                      className="w-5 h-5 text-[#0f2749]"
                      readOnly
                    />
                    <span className="text-neutral-900">Work completed per scope and specifications</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      checked={workOrder.completionPhotoUrls.length > 0}
                      className="w-5 h-5 text-[#0f2749]"
                      readOnly
                    />
                    <span className="text-neutral-900">Completion photos uploaded</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" className="w-5 h-5 text-[#0f2749]" readOnly />
                    <span className="text-neutral-900">Site cleaned and restored</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-neutral-200 cursor-pointer hover:bg-neutral-50">
                    <input type="checkbox" className="w-5 h-5 text-[#0f2749]" readOnly />
                    <span className="text-neutral-900">Client walkthrough completed</span>
                  </label>
                </div>

                {!completionCheck.allowed && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    {completionCheck.reason}
                  </div>
                )}
              </div>

              {/* Completion Photos */}
              <div className="card p-6">
                <h3 className="font-bold text-neutral-900 mb-4">Completion Photos</h3>
                {workOrder.completionPhotoUrls.length === 0 ? (
                  <div className="border-2 border-dashed border-neutral-300 p-8 text-center">
                    <Camera className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                    <p className="text-neutral-500 mb-4">No completion photos uploaded</p>
                    <button className="btn-secondary text-sm">Upload Photos</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {workOrder.completionPhotoUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Completion ${i + 1}`}
                        className="w-full h-32 object-cover bg-neutral-100"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Historic Compliance (if historic site) */}
              {site?.isHistoric && (
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-neutral-900">Historic Compliance</h3>
                    <button
                      onClick={() => setShowHistoricDocs(!showHistoricDocs)}
                      className="text-sm text-[#0f2749] hover:underline"
                    >
                      {showHistoricDocs ? 'Hide' : 'Show'} Documentation Form
                    </button>
                  </div>

                  {workOrder.historicCompliance ? (
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-neutral-600">Materials Used</p>
                        <p className="text-neutral-900">{workOrder.historicCompliance.materialsUsed}</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">Methods Applied</p>
                        <p className="text-neutral-900">{workOrder.historicCompliance.methodsApplied}</p>
                      </div>
                      <div>
                        <p className="text-neutral-600">Architect Guidance</p>
                        <p className="text-neutral-900">{workOrder.historicCompliance.architectGuidance}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800">
                      <AlertTriangle className="w-4 h-4 inline mr-2" />
                      Historic compliance documentation required before completion.
                    </div>
                  )}

                  {showHistoricDocs && (
                    <div className="mt-6 border-t pt-6">
                      <HistoricDocumentation
                        onSave={handleSaveHistoricDocs}
                        workRequestNumber={workOrder.requestNumber}
                        propertyName={site?.name || ''}
                      />
                    </div>
                  )}
                </div>
              )}

              {completionCheck.allowed && (
                <button className="w-full btn-primary py-3">Mark as Complete</button>
              )}
            </div>
          )}

          {/* Invoice Tab */}
          {activeTab === 'invoice' && invoiceCheck.allowed && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Generate Invoice</h2>
                <p className="text-neutral-600 mb-4">
                  This work order is complete and has an approved quote. You can now generate an invoice.
                </p>
                <div className="bg-neutral-50 p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-600">Approved Quote Total</p>
                      <p className="text-lg font-bold">${approvedQuote?.totalEstimate.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-neutral-600">Funding Code</p>
                      <p className="text-lg font-medium">{approvedQuote?.fundingCode || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/invoices/new?workOrder=${workOrder.id}`)}
                  className="btn-primary"
                >
                  Generate Invoice
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card p-6">
            <h3 className="text-lg font-heading font-bold text-neutral-900 mb-4">Current Status</h3>
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(workOrder.status)}
              <span className="text-2xl font-bold text-neutral-900">{workOrder.status}</span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-neutral-600">
                Created: {new Date(workOrder.createdAt).toLocaleDateString()}
              </p>
              <p className="text-neutral-600">
                Updated: {new Date(workOrder.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Project Info */}
          {project && (
            <div className="card p-6">
              <h3 className="text-lg font-heading font-bold text-neutral-900 mb-4">Project</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Building className="w-4 h-4 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-neutral-900">{project.name}</p>
                    <p className="text-neutral-500">{project.clientName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5" />
                  <p className="text-neutral-700">{site?.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* People */}
          <div className="card p-6">
            <h3 className="text-lg font-heading font-bold text-neutral-900 mb-4">People</h3>
            <div className="space-y-4">
              {requestedBy && (
                <div className="flex items-center gap-3">
                  {requestedBy.avatarUrl ? (
                    <img src={requestedBy.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0f2749] flex items-center justify-center text-white text-sm">
                      {requestedBy.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">{requestedBy.name}</p>
                    <p className="text-xs text-neutral-500">Requested By</p>
                  </div>
                </div>
              )}
              {assignedVendor && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">{assignedVendor.name}</p>
                    <p className="text-xs text-neutral-500">Assigned Vendor</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-heading font-bold text-neutral-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {workOrder.status === 'Requested' && (
                <button className="w-full btn-primary py-2 text-sm">Begin Scoping</button>
              )}
              {workOrder.status === 'Scoped' && (
                <button
                  onClick={() => navigate(`/quotes/new/${workOrder.id}`)}
                  className="w-full btn-primary py-2 text-sm"
                >
                  Create Quote
                </button>
              )}
              {workOrder.status === 'AwaitingApproval' && (
                <button className="w-full btn-primary py-2 text-sm">Review Quote</button>
              )}
              {workOrder.status === 'Approved' && scheduleCheck.allowed && (
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="w-full btn-primary py-2 text-sm"
                >
                  Schedule Work
                </button>
              )}
              {workOrder.status === 'InProgress' && (
                <button
                  onClick={() => setActiveTab('completion')}
                  className="w-full btn-primary py-2 text-sm"
                >
                  Record Completion
                </button>
              )}
              {invoiceCheck.allowed && (
                <button
                  onClick={() => navigate(`/invoices/new?workOrder=${workOrder.id}`)}
                  className="w-full btn-primary py-2 text-sm"
                >
                  Generate Invoice
                </button>
              )}
              <button className="w-full btn-secondary py-2 text-sm">Add Note</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type IntakePayload = {
  serviceDetails?: string;
  availability?: {
    primaryDate?: string;
    alternateDate?: string;
    windows?: string[];
  };
  attachments?: string[];
  imageLinks?: string[];
  onsiteNotes?: string;
  lineItems?: Array<{ id?: string; name?: string; quantity?: number; unitPrice?: number }>;
  notes?: string;
  supplementalFiles?: string[];
  submittedBy?: string;
  submittedVia?: string;
};

function SupabaseRequestDetails({
  request,
  contact,
  onBack,
}: {
  request: WorkRequest;
  contact?: Contact;
  onBack: () => void;
}) {
  const intake = (request.intake_payload ?? {}) as IntakePayload;
  const attachments = Array.from(
    new Set([...(intake.attachments ?? []), ...(intake.imageLinks ?? [])])
  ).filter(Boolean);
  const supplemental = (intake.supplementalFiles ?? []).filter(Boolean);
  const lineItems = Array.isArray(intake.lineItems) ? intake.lineItems : [];
  const lineItemsTotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  const availability = intake.availability || {};
  const statusClass: Record<string, string> = {
    Intake: 'bg-slate-100 text-slate-700',
    Scoping: 'bg-blue-100 text-blue-700',
    Estimate: 'bg-sky-100 text-sky-800',
    Approval: 'bg-amber-100 text-amber-800',
    Schedule: 'bg-cyan-100 text-cyan-800',
    Progress: 'bg-blue-100 text-blue-800',
    Complete: 'bg-green-100 text-green-800',
    Invoice: 'bg-purple-100 text-purple-800',
    Paid: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#0f2749] hover:text-[#0f2749]/80"
      >
        <ChevronLeft className="w-5 h-5" /> Back to Work Requests
      </button>

      <section className="card p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Request</p>
            <h1 className="text-3xl font-heading font-bold text-neutral-900">
              {request.request_number || 'New request'}
            </h1>
            <p className="text-neutral-600">{request.property}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                statusClass[request.status] ?? 'bg-slate-100 text-slate-700'
              }`}
            >
              {request.status}
            </span>
            <span className="px-3 py-1 text-xs font-medium rounded-full border text-neutral-700">
              {request.priority || 'Medium'} priority
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-neutral-600">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Submitted via</p>
            <p className="text-neutral-900 font-medium">{request.submitted_via || 'Internal'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Submitted on</p>
            <p className="text-neutral-900 font-medium">
              {request.created_at ? new Date(request.created_at).toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Submitted by</p>
            <p className="text-neutral-900 font-medium">{intake.submittedBy || contact?.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Estimated value</p>
            <p className="text-neutral-900 font-medium">
              {request.estimated_cost ? formatCurrency(Number(request.estimated_cost)) : 'TBD'}
            </p>
          </div>
        </div>
      </section>

      {contact && (
        <section className="card p-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Client contact</p>
          <h3 className="text-xl font-heading text-neutral-900">{contact.name}</h3>
          <p className="text-sm text-neutral-600">{contact.company}</p>
          <div className="text-sm text-neutral-600 space-y-1">
            <p>{contact.email}</p>
            <p>{contact.phone}</p>
          </div>
        </section>
      )}

      <section className="card p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Service overview</p>
          <h2 className="text-xl font-heading text-neutral-900">{request.title || request.description}</h2>
        </div>
        <div className="space-y-3 text-neutral-700">
          <div>
            <p className="text-sm text-neutral-500">Description</p>
            <p>{request.description || 'No description provided'}</p>
          </div>
          {request.scope_of_work && (
            <div>
              <p className="text-sm text-neutral-500">Scope of work</p>
              <p>{request.scope_of_work}</p>
            </div>
          )}
          {intake.serviceDetails && (
            <div>
              <p className="text-sm text-neutral-500">Client notes</p>
              <p>{intake.serviceDetails}</p>
            </div>
          )}
          {intake.onsiteNotes && (
            <div>
              <p className="text-sm text-neutral-500">On-site assessment</p>
              <p>{intake.onsiteNotes}</p>
            </div>
          )}
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Availability</p>
          <h2 className="text-lg font-heading text-neutral-900">Preferred walkthrough windows</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
          <div>
            <p className="text-neutral-500 text-xs uppercase tracking-[0.2em]">Primary date</p>
            <p className="text-neutral-900 font-medium">{availability.primaryDate || 'Anytime'}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs uppercase tracking-[0.2em]">Alternate date</p>
            <p className="text-neutral-900 font-medium">{availability.alternateDate || 'Flexible'}</p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs uppercase tracking-[0.2em]">Windows</p>
            <p className="text-neutral-900 font-medium">
              {availability.windows && availability.windows.length
                ? availability.windows.join(', ')
                : 'Any'}
            </p>
          </div>
        </div>
      </section>

      {lineItems.length > 0 && (
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Products / Services</p>
              <h2 className="text-lg font-heading text-neutral-900">Requested line items</h2>
            </div>
            <p className="text-sm text-neutral-600">Subtotal {formatCurrency(lineItemsTotal)}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="text-neutral-500">
              <tr>
                <th className="text-left py-2">Name</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Unit price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => {
                const quantity = Number(item.quantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const total = quantity * unitPrice;
                return (
                  <tr key={item.id || `${index}-${item.name}`} className="border-t border-neutral-100">
                    <td className="py-2 text-neutral-900">{item.name || 'Line item'}</td>
                    <td className="py-2 text-right text-neutral-600">{quantity}</td>
                    <td className="py-2 text-right text-neutral-600">{formatCurrency(unitPrice)}</td>
                    <td className="py-2 text-right font-medium text-neutral-900">{formatCurrency(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {(attachments.length > 0 || supplemental.length > 0) && (
        <section className="card p-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Files & photos</p>
          {attachments.length > 0 && (
            <div>
              <p className="text-sm font-medium text-neutral-900 mb-2">Uploaded images</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-700">
                {attachments.map((url) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noreferrer" className="text-[#0f2749] underline">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {supplemental.length > 0 && (
            <div>
              <p className="text-sm font-medium text-neutral-900 mb-2">Supplemental files</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-700">
                {supplemental.map((url) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noreferrer" className="text-[#0f2749] underline">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {(intake.notes || request.inspection_notes) && (
        <section className="card p-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Internal notes</p>
          {intake.notes && <p className="text-neutral-700">{intake.notes}</p>}
          {request.inspection_notes && <p className="text-neutral-700">{request.inspection_notes}</p>}
        </section>
      )}
    </div>
  );
}
