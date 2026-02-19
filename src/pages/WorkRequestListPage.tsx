import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Eye, Edit2, Search, Building, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { LeadIntakeModal } from '../components/leads/LeadIntakeModal';
import { useProfileData } from '../hooks/useProfileData';

// Import pipeline data helpers
import {
  getSiteById,
  getCampusById,
  getApprovedQuote,
  type WorkOrderStatus,
} from '../data/pipeline';

export function WorkRequestListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { workOrders: mockWorkOrders, campuses: mockCampuses } = useProfileData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || '');
  const [selectedCampus, setSelectedCampus] = useState<string>(searchParams.get('campus') || '');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [showLeadIntake, setShowLeadIntake] = useState(false);

  // Filter work orders
  const filteredWorkOrders = useMemo(() => {
    return mockWorkOrders.filter((wo) => {
      const site = getSiteById(wo.siteId);

      const matchesSearch =
        wo.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !selectedStatus || wo.status === selectedStatus;
      const matchesCampus = !selectedCampus || site?.campusId === selectedCampus;
      const matchesPriority = !selectedPriority || wo.priority === selectedPriority;

      return matchesSearch && matchesStatus && matchesCampus && matchesPriority;
    });
  }, [searchTerm, selectedStatus, selectedCampus, selectedPriority]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = filteredWorkOrders.length;
    const inProgress = filteredWorkOrders.filter((wo) =>
      ['InProgress', 'Scheduled', 'AwaitingApproval'].includes(wo.status)
    ).length;
    const completed = filteredWorkOrders.filter((wo) =>
      ['Completed', 'Invoiced', 'Paid'].includes(wo.status)
    ).length;
    const totalValue = filteredWorkOrders.reduce((sum, wo) => sum + (wo.estimatedCost || 0), 0);
    return { total, inProgress, completed, totalValue };
  }, [filteredWorkOrders]);

  const getStatusColor = (status: WorkOrderStatus) => {
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

  const statuses: WorkOrderStatus[] = [
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">
            Work Orders
          </h1>
          <p className="text-neutral-600">
            Manage all work orders across campuses
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLeadIntake(true)}
            className="border border-neutral-300 text-neutral-700 inline-flex items-center gap-2 py-3 px-6 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" /> New Intake
          </button>
          <button
            onClick={() => navigate('/work-requests/new')}
            className="bg-[#143352] hover:bg-[#143352]/90 text-white inline-flex items-center gap-2 py-3 px-6 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Work Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-neutral-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#143352]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#143352]"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replace(/([A-Z])/g, ' $1').trim()}
              </option>
            ))}
          </select>

          {/* Campus Filter */}
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="px-4 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#143352]"
          >
            <option value="">All Campuses</option>
            {mockCampuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#143352]"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-neutral-200 overflow-hidden">
        {filteredWorkOrders.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <p>No work orders found</p>
            <button
              onClick={() => navigate('/work-requests/new')}
              className="text-[#143352] font-medium hover:underline mt-2"
            >
              Create your first work order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Work Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Est. Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredWorkOrders.map((wo) => {
                  const site = getSiteById(wo.siteId);
                  const campus = site ? getCampusById(site.campusId) : null;
                  const approvedQuote = getApprovedQuote(wo.id);

                  return (
                    <tr
                      key={wo.id}
                      className="hover:bg-neutral-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/work-requests/${wo.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-neutral-900">{wo.requestNumber}</p>
                            {site?.isHistoric && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5">
                                Historic
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500 truncate max-w-xs">{wo.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-neutral-400" />
                          <div>
                            <p className="text-sm text-neutral-900">{site?.name}</p>
                            <p className="text-xs text-neutral-500">{campus?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 font-medium ${getPriorityColor(wo.priority)}`}>
                          {wo.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {wo.status === 'Blocked' && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-xs px-2 py-1 font-medium ${getStatusColor(wo.status)}`}>
                            {wo.status.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 h-1.5 w-20 rounded-full">
                            <div
                              className="bg-[#143352] h-1.5 rounded-full"
                              style={{ width: `${wo.percentComplete}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-600">{wo.percentComplete}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-medium text-neutral-900">
                          {wo.estimatedCost ? `$${wo.estimatedCost.toLocaleString()}` : 'TBD'}
                        </p>
                        {approvedQuote && (
                          <p className="text-xs text-neutral-500">
                            Quote: ${approvedQuote.totalEstimate.toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/work-requests/${wo.id}`)}
                            className="p-2 text-neutral-600 hover:text-[#143352] hover:bg-neutral-100 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/work-requests/${wo.id}/edit`)}
                            className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-neutral-100 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4">
          <p className="text-sm text-neutral-600">Total Work Orders</p>
          <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <p className="text-sm text-neutral-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <p className="text-sm text-neutral-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white border border-neutral-200 p-4">
          <p className="text-sm text-neutral-600">Total Est. Value</p>
          <p className="text-2xl font-bold text-neutral-900">${stats.totalValue.toLocaleString()}</p>
        </div>
      </div>

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
