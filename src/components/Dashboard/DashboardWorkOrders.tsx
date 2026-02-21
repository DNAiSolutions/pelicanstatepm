import { ArrowRight } from 'lucide-react';
import type { WorkOrder } from '../../data/pipeline';
import { getSiteById } from '../../data/pipeline';

interface DashboardWorkOrdersProps {
  workOrders: WorkOrder[];
  statusFilter: 'all' | 'inProgress' | 'completed';
  onStatusFilterChange: (filter: 'all' | 'inProgress' | 'completed') => void;
  onWorkOrderClick: (id: string) => void;
  onViewAllClick: () => void;
}

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

export function DashboardWorkOrders({
  workOrders,
  statusFilter,
  onStatusFilterChange,
  onWorkOrderClick,
  onViewAllClick,
}: DashboardWorkOrdersProps) {
  return (
    <div className="bg-white border border-neutral-200 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-bold text-neutral-900">Recent Work Orders</h2>
        <button
          onClick={onViewAllClick}
          className="text-sm text-[#0f2749] hover:text-[#0f2749]/80 font-medium"
        >
          View All →
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-200">
        <button
          onClick={() => onStatusFilterChange('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === 'all'
              ? 'border-[#0f2749] text-[#0f2749]'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => onStatusFilterChange('inProgress')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === 'inProgress'
              ? 'border-[#0f2749] text-[#0f2749]'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => onStatusFilterChange('completed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            statusFilter === 'completed'
              ? 'border-[#0f2749] text-[#0f2749]'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Work Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-neutral-600">Work Order</th>
              <th className="text-left py-3 px-4 font-semibold text-neutral-600">Location</th>
              <th className="text-left py-3 px-4 font-semibold text-neutral-600">Priority</th>
              <th className="text-left py-3 px-4 font-semibold text-neutral-600">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-neutral-600">Est. Cost</th>
              <th className="text-center py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {workOrders.map((wo) => {
              const site = getSiteById(wo.siteId);
              return (
                <tr
                  key={wo.id}
                  className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  onClick={() => onWorkOrderClick(wo.id)}
                >
                  <td className="py-3 px-4">
                    <p className="font-medium text-neutral-900">{wo.requestNumber}</p>
                    <p className="text-xs text-neutral-500">{wo.title}</p>
                  </td>
                  <td className="py-3 px-4 text-neutral-600">{site?.name || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(wo.priority)}`}>
                      {wo.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(wo.status)}`}>
                      {wo.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-neutral-900">
                    ${wo.estimatedCost?.toLocaleString() || 'TBD'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
