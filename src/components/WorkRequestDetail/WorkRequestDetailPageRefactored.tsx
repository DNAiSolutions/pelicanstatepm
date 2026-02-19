import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, FileText, Clock, Calendar, DollarSign, ClipboardCheck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  WorkOrder,
  Quote,
  WorkLog,
} from '../../data/pipeline';
import {
  getWorkOrderById,
  getQuotesByWorkOrderId,
  getApprovedQuote,
  getWorkLogsByWorkOrderId,
  getSiteById,
} from '../../data/pipeline';
import {
  WorkRequestHeader,
  WorkRequestQuotes,
  WorkRequestSidebar,
} from './index';

type TabType = 'overview' | 'timeline' | 'quotes' | 'schedule' | 'completion' | 'invoice';

const getLogTypeIcon = (type: string) => {
  switch (type) {
    case 'approval':
      return '✅';
    case 'delay':
      return '⚠️';
    case 'update':
      return '📝';
    default:
      return '•';
  }
};

export function WorkRequestDetailPageRefactored() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) {
      navigate('/work-requests');
      return;
    }

    try {
      setIsLoading(true);
      const wo = getWorkOrderById(id);
      if (wo) {
        setWorkOrder(wo);
        setQuotes(getQuotesByWorkOrderId(id));
        setWorkLogs(getWorkLogsByWorkOrderId(id));
      } else {
        toast.error('Work order not found');
        navigate('/work-requests');
      }
    } catch (error) {
      console.error('Failed to load:', error);
      toast.error('Failed to load work request');
      navigate('/work-requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
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
          ? { ...quote, status: 'Rejected' }
          : quote
      )
    );
    toast.success('Change request recorded (mock)');
  };

  // Permissions checks
  const site = workOrder ? getSiteById(workOrder.siteId) : null;
  const approvedQuote = workOrder ? getApprovedQuote(workOrder.id) : null;
  const scheduleCheck = { allowed: workOrder?.status === 'Approved' || false };
  const completionCheck = { allowed: workOrder?.status === 'InProgress' || false };
  const invoiceCheck = { allowed: (workOrder?.status === 'Completed' && !!approvedQuote) || false };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#143352]/20 border-t-[#143352] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading work order...</p>
        </div>
      </div>
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

  // Build tabs list
  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode; locked: boolean; lockReason?: string }> = [
    { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" />, locked: false },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" />, locked: false },
    { id: 'quotes', label: 'Quotes', icon: <DollarSign className="w-4 h-4" />, locked: false },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: <Calendar className="w-4 h-4" />,
      locked: !scheduleCheck.allowed,
      lockReason: 'Schedule only after approval',
    },
    {
      id: 'completion',
      label: 'Completion',
      icon: <ClipboardCheck className="w-4 h-4" />,
      locked: !completionCheck.allowed,
      lockReason: 'Mark complete when in progress',
    },
    {
      id: 'invoice',
      label: 'Invoice',
      icon: <DollarSign className="w-4 h-4" />,
      locked: !invoiceCheck.allowed,
      lockReason: 'Invoice after completion',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <WorkRequestHeader
        workOrder={workOrder}
        onBackClick={() => navigate('/work-requests')}
        onEditClick={() => navigate(`/work-requests/${workOrder.id}/edit`)}
      />

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
                  ? 'border-[#143352] text-[#143352]'
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
                            className="bg-[#143352] h-2 rounded-full"
                            style={{ width: `${workOrder.percentComplete}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{workOrder.percentComplete}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historic Site Notice */}
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
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm">
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quotes Tab */}
          {activeTab === 'quotes' && (
            <WorkRequestQuotes
              quotes={quotes}
              onNewQuoteClick={() => navigate(`/estimates/new/${workOrder.id}`)}
              onApproveQuote={handleApproveQuote}
              onRequestChanges={handleRequestQuoteChanges}
            />
          )}
        </div>

        {/* Right Sidebar */}
        <WorkRequestSidebar
          workOrder={workOrder}
          onQuoteCreate={() => navigate(`/estimates/new/${workOrder.id}`)}
          onScheduleClick={() => setActiveTab('schedule')}
          onCompletionClick={() => setActiveTab('completion')}
          onInvoiceGenerate={() => navigate(`/invoices/new?workOrder=${workOrder.id}`)}
          onAddNote={() => toast.success('Add note functionality coming soon')}
          scheduleAllowed={scheduleCheck.allowed}
          invoiceAllowed={invoiceCheck.allowed}
        />
      </div>
    </div>
  );
}
