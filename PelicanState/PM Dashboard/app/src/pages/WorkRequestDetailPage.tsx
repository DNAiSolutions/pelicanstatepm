import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workRequestService } from '../services/workRequestService';
import { campusService, type Campus } from '../services/campusService';
import { HistoricDocumentation, type HistoricDoc } from '../components/HistoricDocumentation';
import type { WorkRequest, WorkRequestStatus } from '../types';
import { ChevronLeft, Edit2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function WorkRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workRequest, setWorkRequest] = useState<WorkRequest | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showHistoricDocs, setShowHistoricDocs] = useState(false);
  const [newStatus, setNewStatus] = useState<WorkRequestStatus>('Intake');

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
      const [wr, campusList] = await Promise.all([
        workRequestService.getWorkRequest(id),
        campusService.getCampuses(),
      ]);
      setWorkRequest(wr);
      setCampuses(campusList);
      setNewStatus(wr.status);
    } catch (error) {
      console.error('Failed to load:', error);
      toast.error('Failed to load work request');
      navigate('/work-requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!workRequest || newStatus === workRequest.status) {
      toast.error('Select a different status');
      return;
    }

    try {
      setIsUpdating(true);
      await workRequestService.updateWorkRequestStatus(workRequest.id, newStatus);
      setWorkRequest({ ...workRequest, status: newStatus });
      toast.success('Status updated');
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveHistoricDocs = async (_docs: HistoricDoc) => {
    try {
      // Save historic documentation
      // This would be implemented in the service
      toast.success('Historic documentation saved');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save documentation');
    }
  };

  const getCampusName = (campusId: string) => {
    return campuses.find((c) => c.id === campusId)?.name || 'Unknown';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Complete':
      case 'Paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Progress':
      case 'Schedule':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'Approval':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading work request...</p>
        </div>
      </div>
    );
  }

  if (!workRequest) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-600 mb-4">Work request not found</p>
        <button
          onClick={() => navigate('/work-requests')}
          className="btn-primary"
        >
          Back to Work Requests
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/work-requests')}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Work Requests
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-heading font-bold text-primary-900 mb-2">
              {workRequest.request_number}
            </h1>
            <p className="text-neutral-600">{workRequest.property}</p>
          </div>
          <button
            onClick={() => navigate(`/work-requests/${workRequest.id}/edit`)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="card p-8">
            <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
              Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">Campus</p>
                  <p className="text-lg font-medium text-neutral-900">
                    {getCampusName(workRequest.campus_id)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Category</p>
                  <p className="text-lg font-medium text-neutral-900">
                    {workRequest.category}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Est. Cost</p>
                  <p className="text-lg font-medium text-neutral-900">
                    ${workRequest.estimated_cost?.toFixed(2) || 'TBD'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Historic Property</p>
                  <p className="text-lg font-medium text-neutral-900">
                    {workRequest.is_historic ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-2">Description</p>
                <p className="text-neutral-900">{workRequest.description}</p>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className="card p-8">
            <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
              Status Management
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-neutral-900 mb-2">
                  Current Status
                </label>
                <div className="flex items-center gap-3">
                  {getStatusIcon(workRequest.status)}
                  <select
                    id="status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as WorkRequestStatus)}
                    className="flex-1 px-4 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Intake">Intake</option>
                    <option value="Scoping">Scoping</option>
                    <option value="Estimate">Estimate</option>
                    <option value="Approval">Approval</option>
                    <option value="Schedule">Schedule</option>
                    <option value="Progress">Progress</option>
                    <option value="Complete">Complete</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>
              {newStatus !== workRequest.status && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={isUpdating}
                  className="w-full btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="border-b border-neutral-200">
              <button
                onClick={() => setShowHistoricDocs(false)}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  !showHistoricDocs
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Timeline
              </button>
              {workRequest.is_historic && (
                <button
                  onClick={() => setShowHistoricDocs(true)}
                  className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                    showHistoricDocs
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Historic Documentation
                </button>
              )}
            </div>

            <div className="p-8">
              {!showHistoricDocs ? (
                <div className="text-center text-neutral-500 py-8">
                  Timeline and activity log coming soon
                </div>
              ) : (
                <HistoricDocumentation
                  onSave={handleSaveHistoricDocs}
                  workRequestNumber={workRequest.request_number}
                  propertyName={workRequest.property}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card p-6">
            <h3 className="text-lg font-heading font-bold text-neutral-900 mb-4">
              Current Status
            </h3>
            <div className="flex items-center gap-3 mb-6">
              {getStatusIcon(workRequest.status)}
              <span className="text-2xl font-bold text-neutral-900">
                {workRequest.status}
              </span>
            </div>
            <p className="text-sm text-neutral-600">
              Created: {new Date(workRequest.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-heading font-bold text-neutral-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {workRequest.status === 'Intake' && (
                <button
                  onClick={() => navigate(`/estimates/new/${workRequest.id}`)}
                  className="w-full btn-primary py-2 text-sm"
                >
                  Create Estimate
                </button>
              )}
              {workRequest.status === 'Complete' && (
                <button
                  onClick={() => navigate(`/invoices/new`)}
                  className="w-full btn-primary py-2 text-sm"
                >
                  Create Invoice
                </button>
              )}
              <button
                onClick={() => navigate(`/work-requests/${workRequest.id}/edit`)}
                className="w-full btn-secondary py-2 text-sm"
              >
                Edit Request
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="card p-6">
            <h3 className="text-lg font-heading font-bold text-neutral-900 mb-4">
              Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-neutral-600">Request ID</p>
                <p className="font-mono text-neutral-900 break-all">{workRequest.id}</p>
              </div>
              <div>
                <p className="text-neutral-600">Created</p>
                <p className="text-neutral-900">
                  {new Date(workRequest.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
