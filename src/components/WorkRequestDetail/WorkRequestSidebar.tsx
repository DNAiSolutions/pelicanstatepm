import { Building, MapPin, User } from 'lucide-react';
import type { WorkOrder } from '../../data/pipeline';
import { getProjectById, getSiteById, getUserById, getVendorById } from '../../data/pipeline';

interface WorkRequestSidebarProps {
  workOrder: WorkOrder;
  onQuoteCreate: () => void;
  onScheduleClick: () => void;
  onCompletionClick: () => void;
  onInvoiceGenerate: () => void;
  onAddNote: () => void;
  scheduleAllowed: boolean;
  invoiceAllowed: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Requested':
      return '📋';
    case 'Scoped':
      return '📏';
    case 'AwaitingApproval':
      return '⏳';
    case 'Approved':
      return '✅';
    case 'Scheduled':
      return '📅';
    case 'InProgress':
      return '🔨';
    case 'Completed':
      return '🎉';
    case 'Invoiced':
      return '💰';
    case 'Paid':
      return '💵';
    case 'Closed':
      return '🔒';
    default:
      return '•';
  }
};

export function WorkRequestSidebar({
  workOrder,
  onQuoteCreate,
  onScheduleClick,
  onCompletionClick,
  onInvoiceGenerate,
  onAddNote,
  scheduleAllowed,
  invoiceAllowed,
}: WorkRequestSidebarProps) {
  const project = getProjectById(workOrder.projectId);
  const site = getSiteById(workOrder.siteId);
  const requestedBy = getUserById(workOrder.requestedById);
  const assignedVendor = workOrder.assignedVendorId ? getVendorById(workOrder.assignedVendorId) : null;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="card p-6">
        <h3 className="text-lg font-heading font-bold text-neutral-900 mb-4">Current Status</h3>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{getStatusIcon(workOrder.status)}</span>
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
            <button onClick={onQuoteCreate} className="w-full btn-primary py-2 text-sm">
              Create Quote
            </button>
          )}
          {workOrder.status === 'AwaitingApproval' && (
            <button className="w-full btn-primary py-2 text-sm">Review Quote</button>
          )}
          {workOrder.status === 'Approved' && scheduleAllowed && (
            <button onClick={onScheduleClick} className="w-full btn-primary py-2 text-sm">
              Schedule Work
            </button>
          )}
          {workOrder.status === 'InProgress' && (
            <button onClick={onCompletionClick} className="w-full btn-primary py-2 text-sm">
              Record Completion
            </button>
          )}
          {invoiceAllowed && (
            <button onClick={onInvoiceGenerate} className="w-full btn-primary py-2 text-sm">
              Generate Invoice
            </button>
          )}
          <button onClick={onAddNote} className="w-full btn-secondary py-2 text-sm">
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}
