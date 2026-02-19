import { ChevronLeft, Edit2, CheckCircle } from 'lucide-react';
import type { WorkOrder, WorkOrderStatus } from '../../data/pipeline';
import { getSiteById, getCampusById } from '../../data/pipeline';

interface WorkRequestHeaderProps {
  workOrder: WorkOrder;
  onBackClick: () => void;
  onEditClick: () => void;
}

const STATUS_FLOW: WorkOrderStatus[] = [
  'Requested',
  'Scoped',
  'AwaitingApproval',
  'Approved',
  'Scheduled',
  'InProgress',
  'Completed',
];

const getStatusColor = (status: WorkOrderStatus): string => {
  switch (status) {
    case 'Requested':
      return 'bg-gray-100 text-gray-800';
    case 'Scoped':
      return 'bg-blue-100 text-blue-800';
    case 'AwaitingApproval':
      return 'bg-yellow-100 text-yellow-800';
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'Scheduled':
      return 'bg-purple-100 text-purple-800';
    case 'InProgress':
      return 'bg-orange-100 text-orange-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'Invoiced':
      return 'bg-indigo-100 text-indigo-800';
    case 'Paid':
      return 'bg-teal-100 text-teal-800';
    case 'Closed':
      return 'bg-neutral-100 text-neutral-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function WorkRequestHeader({
  workOrder,
  onBackClick,
  onEditClick,
}: WorkRequestHeaderProps) {
  const site = getSiteById(workOrder.siteId);
  const campus = site ? getCampusById(site.campusId) : undefined;

  return (
    <div className="mb-8">
      <button
        onClick={onBackClick}
        className="flex items-center gap-2 text-[#143352] hover:text-[#143352]/80 mb-4"
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
            {site?.name} - {campus?.name}
          </p>
        </div>
        <button
          onClick={onEditClick}
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
                      ? 'bg-[#143352] text-white'
                      : isPast
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isPast ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                <span
                  className={`ml-2 text-xs ${
                    isCurrent ? 'text-[#143352] font-medium' : isPast ? 'text-green-600' : 'text-gray-400'
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
  );
}
