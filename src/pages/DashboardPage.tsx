import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Plus,
  Building,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Play,
  FileText,
  FolderKanban,
} from 'lucide-react';
import { useProfileData } from '../hooks/useProfileData';
import { useAdminDashboardData } from '../hooks/useAdminDashboardData';
import { getSiteById, getCampusById } from '../data/pipeline';
import toast from 'react-hot-toast';
import { LeadIntakeModal } from '../components/leads/LeadIntakeModal';

type DisplayWorkOrder = {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  priority?: string | null;
  campusId?: string | null;
  campusName?: string | null;
  estimatedCost?: number | null;
};

type DisplayInvoice = {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  submittedAt?: string | null;
  paidAt?: string | null;
};

export function DashboardPage() {
  const navigate = useNavigate();
  const profileData = useProfileData();
  const { isAdminProfile, projects, workOrders, campuses, invoices, metrics, getProjectMetrics } = profileData;
  const adminData = useAdminDashboardData(isAdminProfile);
  const [statusFilter, setStatusFilter] = useState<'all' | 'inProgress' | 'completed'>('all');
  const [showLeadIntake, setShowLeadIntake] = useState(false);

  const featuredProject = projects[0];
  const featuredProjectMetrics = useMemo(
    () =>
      featuredProject ? getProjectMetrics(featuredProject.id) : { total: 0, completed: 0 },
    [featuredProject?.id, getProjectMetrics]
  );

  const displayWorkOrders: DisplayWorkOrder[] = useMemo(() => {
    if (isAdminProfile) {
      return adminData.workRequests;
    }
    return workOrders.map((wo) => {
      const site = getSiteById(wo.siteId);
      const campus = site ? getCampusById(site.campusId) : null;
      return {
        id: wo.id,
        requestNumber: wo.requestNumber,
        title: wo.title,
        status: wo.status,
        priority: wo.priority,
        campusId: site?.campusId ?? null,
        campusName: campus?.name ?? null,
        estimatedCost: wo.estimatedCost ?? null,
      } satisfies DisplayWorkOrder;
    });
  }, [isAdminProfile, adminData.workRequests, workOrders]);

  const displayInvoices: DisplayInvoice[] = useMemo(() => {
    if (isAdminProfile) {
      return adminData.invoices;
    }
    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.totalAmount,
      status: inv.status,
      submittedAt: inv.submittedAt,
      paidAt: inv.paidAt,
    }));
  }, [isAdminProfile, adminData.invoices, invoices]);

  const dashboardMetrics = isAdminProfile ? adminData.metrics : metrics;

  const filteredWorkOrders = useMemo(() => {
    let orders = [...displayWorkOrders];
    if (statusFilter === 'inProgress') {
      orders = orders.filter((wo) => ['InProgress', 'Scheduled'].includes(wo.status));
    } else if (statusFilter === 'completed') {
      orders = orders.filter((wo) => wo.status === 'Completed');
    }
    return orders.slice(0, 6);
  }, [statusFilter, displayWorkOrders]);

  // Calculate timeline progress for featured project
  const getTimelineProgress = () => {
    if (!featuredProject) return 0;
    const start = new Date(featuredProject.startDate);
    const end = new Date(featuredProject.endDate);
    const today = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();
    return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
  };

  const timelineProgress = getTimelineProgress();

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

  if (isAdminProfile && adminData.loading) {
    return (
      <div className="p-8 text-sm text-neutral-600">
        Loading live facility data from Supabase...
      </div>
    );
  }

  if (isAdminProfile && adminData.error) {
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
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-heading font-bold text-neutral-900">
            Operations Dashboard
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Pelican State facilities management across Wallace, Woodland, and Paris campuses
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
            className="flex items-center gap-2 bg-[#143352] hover:bg-[#143352]/90 text-white px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Work Request
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Active Work Value */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-[#143352]/10 text-[#143352]">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5">
              Active
            </span>
          </div>
          <h3 className="text-sm text-neutral-600 mb-1">Active Work Value</h3>
          <p className="text-2xl font-bold text-neutral-900">
            ${dashboardMetrics.activeValue.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {dashboardMetrics.inProgressCount + dashboardMetrics.awaitingApprovalCount} work orders in pipeline
          </p>
        </div>

        {/* In Progress */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-blue-100 text-blue-600">
              <Play className="w-5 h-5" />
            </div>
             <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5">
               {dashboardMetrics.inProgressCount}
            </span>
          </div>
          <h3 className="text-sm text-neutral-600 mb-1">In Progress</h3>
          <p className="text-2xl font-bold text-neutral-900">{dashboardMetrics.inProgressCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Work orders being executed</p>
        </div>

        {/* Awaiting Approval */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-yellow-100 text-yellow-600">
              <Clock className="w-5 h-5" />
            </div>
             <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5">
               Pending
             </span>
          </div>
          <h3 className="text-sm text-neutral-600 mb-1">Awaiting Approval</h3>
          <p className="text-2xl font-bold text-neutral-900">{dashboardMetrics.awaitingApprovalCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Quotes need review</p>
        </div>

        {/* Completed */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-green-100 text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
             <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5">
               Done
             </span>
          </div>
          <h3 className="text-sm text-neutral-600 mb-1">Completed</h3>
          <p className="text-2xl font-bold text-neutral-900">{dashboardMetrics.completedCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Ready for invoicing</p>
        </div>
      </div>

       {/* Main Grid */}
       <div className="grid grid-cols-3 gap-6">
         {/* Featured Project Timeline */}
         <div className="col-span-2 bg-white border border-neutral-200 p-6">
           {!featuredProject && isAdminProfile ? (
             <div className="text-center py-12 text-neutral-500">
               <FolderKanban className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
               <p className="text-base font-medium mb-1">No Projects Yet</p>
               <p className="text-sm mb-4">Start adding projects to monitor them here</p>
               <button
                 onClick={() => navigate(`/projects`)}
                 className="text-sm text-[#143352] hover:underline font-medium"
               >
                 View Projects
               </button>
             </div>
           ) : featuredProject ? (
             <>
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="text-base font-semibold text-neutral-900">{featuredProject.name}</h3>
                   <p className="text-sm text-neutral-500">{featuredProject.clientName}</p>
                 </div>
                 <button
                   onClick={() => navigate(`/projects`)}
                   className="text-sm text-[#143352] hover:underline"
                 >
                   View All Projects
                 </button>
               </div>

               {/* Timeline Bar */}
               <div className="mb-6">
                 <div className="flex items-center gap-2 mb-3">
                   <div
                     className="h-10 bg-[#143352] flex items-center justify-center text-white font-semibold text-sm"
                     style={{ width: `${timelineProgress}%` }}
                   >
                     {timelineProgress}% Timeline
                   </div>
                   <div
                     className="h-10 bg-[#143352]/10"
                     style={{
                       width: `${100 - timelineProgress}%`,
                       backgroundImage:
                         'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.5) 10px, rgba(255,255,255,.5) 20px)',
                     }}
                   />
                 </div>

                 {/* Date Labels */}
                 <div className="flex justify-between text-xs text-neutral-600">
                   <div>
                     <p className="font-medium">Start Date</p>
                     <p className="text-neutral-900">
                       {new Date(featuredProject.startDate).toLocaleDateString()}
                     </p>
                   </div>
                   <div className="text-center">
                     <p className="font-medium">Today</p>
                     <p className="text-neutral-900">{new Date().toLocaleDateString()}</p>
                   </div>
                   <div className="text-right">
                     <p className="font-medium">End Date</p>
                     <p className="text-neutral-900">
                       {new Date(featuredProject.endDate).toLocaleDateString()}
                     </p>
                   </div>
                 </div>
               </div>

               {/* Project Stats */}
               <div className="grid grid-cols-4 gap-4 pt-4 border-t border-neutral-100">
                 <div>
                   <p className="text-xs text-neutral-500">Total Budget</p>
                   <p className="text-lg font-bold text-neutral-900">
                     ${featuredProject.totalBudget.toLocaleString()}
                   </p>
                 </div>
                 <div>
                   <p className="text-xs text-neutral-500">Spent</p>
                   <p className="text-lg font-bold text-neutral-900">
                     ${featuredProject.spentBudget.toLocaleString()}
                   </p>
                 </div>
                 <div>
                   <p className="text-xs text-neutral-500">Work Orders</p>
                   <p className="text-lg font-bold text-neutral-900">{featuredProjectMetrics.total}</p>
                 </div>
                 <div>
                   <p className="text-xs text-neutral-500">Completed</p>
                   <p className="text-lg font-bold text-green-600">
                     {featuredProjectMetrics.completed}/{featuredProjectMetrics.total}
                   </p>
                 </div>
               </div>
             </>
           ) : null}
         </div>

        {/* Campus Overview */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900">Campuses</h3>
          </div>

          {isAdminProfile ? (
            <div className="space-y-4">
              {adminData.campuses.length === 0 ? (
                <div className="text-sm text-neutral-500">
                  No campuses yet. Add one in Supabase to begin tracking.
                </div>
              ) : (
                adminData.campuses.map((campus) => {
                  const campusWorkOrders = displayWorkOrders.filter((wo) => wo.campusId === campus.id);
                  const activeCount = campusWorkOrders.filter((wo) =>
                    ['InProgress', 'Scheduled', 'AwaitingApproval'].includes(wo.status)
                  ).length;

                  return (
                    <div
                      key={campus.id}
                      className="p-3 border border-neutral-100 hover:border-[#143352]/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/work-requests?campus=${campus.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-neutral-400" />
                          <span className="font-medium text-neutral-900">{campus.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 ${getPriorityColor(campus.priority || 'Medium')}`}>
                          {campus.priority || 'Medium'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{campusWorkOrders.length} total work requests</span>
                        <span className="text-[#143352] font-medium">{activeCount} active</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {campuses.map((campus) => {
                const campusWorkOrders = workOrders.filter((wo) => {
                  const site = getSiteById(wo.siteId);
                  return site?.campusId === campus.id;
                });
                const activeCount = campusWorkOrders.filter((wo) =>
                  ['InProgress', 'Scheduled', 'AwaitingApproval'].includes(wo.status)
                ).length;

                return (
                  <div
                    key={campus.id}
                    className="p-3 border border-neutral-100 hover:border-[#143352]/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/work-requests?campus=${campus.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-neutral-400" />
                        <span className="font-medium text-neutral-900">{campus.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 ${getPriorityColor(campus.priority)}`}>
                        {campus.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{campusWorkOrders.length} total work orders</span>
                      <span className="text-[#143352] font-medium">{activeCount} active</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-neutral-900">Recent Work Orders</h3>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-[#143352] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('inProgress')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === 'inProgress'
                    ? 'bg-[#143352] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-[#143352] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Completed
              </button>
            </div>
            <button
              onClick={() => navigate('/work-requests')}
              className="text-sm text-[#143352] hover:underline"
            >
              View All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">
                  Work Order
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">
                  Location
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">
                  Priority
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600">
                  Est. Cost
                </th>
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
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{wo.requestNumber}</p>
                      <p className="text-xs text-neutral-500 truncate max-w-xs">{wo.title}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-neutral-900">{wo.campusName || 'N/A'}</p>
                    <p className="text-xs text-neutral-500">
                      {wo.campusId ? 'Campus' : isAdminProfile ? 'Live record' : ''}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 font-medium ${getPriorityColor(wo.priority || 'Medium')}`}>
                      {wo.priority || 'Medium'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 font-medium ${getStatusColor(wo.status)}`}>
                      {wo.status.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <p className="text-sm font-medium text-neutral-900">
                      {wo.estimatedCost ? `$${wo.estimatedCost.toLocaleString()}` : 'TBD'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row - Invoices & Blocked Items */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900">Recent Invoices</h3>
            <button
              onClick={() => navigate('/invoices')}
              className="text-sm text-[#143352] hover:underline"
            >
              View All
            </button>
          </div>

          {displayInvoices.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">No invoices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayInvoices.slice(0, 3).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 border border-neutral-100 hover:border-[#143352]/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <div>
                    <p className="font-medium text-neutral-900">{inv.invoiceNumber}</p>
                    <p className="text-xs text-neutral-500">
                      {inv.paidAt
                        ? `Paid ${new Date(inv.paidAt).toLocaleDateString()}`
                        : inv.submittedAt
                        ? `Submitted ${new Date(inv.submittedAt).toLocaleDateString()}`
                        : 'Draft'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">
                      ${inv.totalAmount.toLocaleString()}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 ${
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

        {/* Blocked / Attention Needed */}
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-neutral-900">Needs Attention</h3>
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 font-medium">
              {dashboardMetrics.blockedCount + dashboardMetrics.awaitingApprovalCount}
            </span>
          </div>

          <div className="space-y-3">
            {/* Blocked items */}
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
                    <p className="font-medium text-neutral-900 text-sm">{wo.requestNumber}</p>
                    <p className="text-xs text-neutral-600">{wo.title}</p>
                  </div>
                </div>
              ))}

            {/* Awaiting approval items */}
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
                    <p className="font-medium text-neutral-900 text-sm">{wo.requestNumber}</p>
                    <p className="text-xs text-neutral-600">Quote pending approval</p>
                  </div>
                </div>
              ))}

            {dashboardMetrics.blockedCount + dashboardMetrics.awaitingApprovalCount === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">All clear - no blocked items</p>
              </div>
            )}
          </div>
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
