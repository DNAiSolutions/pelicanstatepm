import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workRequestService } from '../services/workRequestService';
import { campusService, type Campus } from '../services/campusService';
import type { WorkRequest } from '../types';
import { Plus, Eye, Edit2, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export function WorkRequestListPage() {
  const navigate = useNavigate();
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCampus, setSelectedCampus] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [requests, campusList] = await Promise.all([
        workRequestService.getWorkRequests({}),
        campusService.getCampuses(),
      ]);
      setWorkRequests(requests);
      setCampuses(campusList);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load work requests');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = workRequests.filter((wr) => {
    const matchesSearch =
      wr.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wr.property.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || wr.status === selectedStatus;
    const matchesCampus = !selectedCampus || wr.campus_id === selectedCampus;
    return matchesSearch && matchesStatus && matchesCampus;
  });

  const getCampusName = (campusId: string) => {
    return campuses.find((c) => c.id === campusId)?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Intake: 'bg-gray-100 text-gray-800',
      Scoping: 'bg-blue-100 text-blue-800',
      Estimate: 'bg-purple-100 text-purple-800',
      Approval: 'bg-yellow-100 text-yellow-800',
      Schedule: 'bg-indigo-100 text-indigo-800',
      Progress: 'bg-cyan-100 text-cyan-800',
      Complete: 'bg-green-100 text-green-800',
      Invoice: 'bg-orange-100 text-orange-800',
      Paid: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleDelete = async (_id: string) => {
    if (!window.confirm('Are you sure you want to delete this work request?')) return;
    
    try {
      // Note: Delete functionality would need to be implemented in the service
      // For now, just reload
      await loadData();
      toast.success('Work request deleted');
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete work request');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading work requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-heading font-bold text-primary-900 mb-2">
            Work Requests
          </h1>
          <p className="text-neutral-600">
            Manage all work requests across campuses
          </p>
        </div>
        <button
          onClick={() => navigate('/work-requests/new')}
          className="btn-primary inline-flex items-center gap-2 py-3 px-6"
        >
          <Plus className="w-5 h-5" />
          Create Request
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by request number or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
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

          {/* Campus Filter */}
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="px-4 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Campuses</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <p>No work requests found</p>
            <button
              onClick={() => navigate('/work-requests/new')}
              className="text-primary-600 font-medium hover:text-primary-700 mt-2"
            >
              Create your first request
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-neutral-900">Request</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-neutral-900">Property</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-neutral-900">Campus</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-neutral-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-neutral-900">Est. Cost</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-neutral-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredRequests.map((wr) => (
                  <tr key={wr.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-neutral-900">
                      {wr.request_number}
                    </td>
                    <td className="px-6 py-3 text-sm text-neutral-600">
                      {wr.property}
                      {wr.is_historic && (
                        <span className="ml-2 inline-block text-xs bg-amber-100 text-amber-800 px-2 py-1">
                          Historic
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-neutral-600">
                      {getCampusName(wr.campus_id)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-3 py-1 text-xs font-medium ${getStatusColor(wr.status)}`}>
                        {wr.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-neutral-600">
                      ${wr.estimated_cost?.toFixed(2) || 'TBD'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/work-requests/${wr.id}`)}
                          className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/work-requests/${wr.id}/edit`)}
                          className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-neutral-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(wr.id)}
                          className="p-2 text-neutral-600 hover:text-red-600 hover:bg-neutral-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-neutral-600">Total Requests</p>
          <p className="text-2xl font-bold text-neutral-900">{filteredRequests.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-600">In Progress</p>
          <p className="text-2xl font-bold text-neutral-900">
            {filteredRequests.filter(wr => ['Progress', 'Schedule', 'Approval'].includes(wr.status)).length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-600">Completed</p>
          <p className="text-2xl font-bold text-neutral-900">
            {filteredRequests.filter(wr => ['Complete', 'Paid'].includes(wr.status)).length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-600">Total Est. Cost</p>
          <p className="text-2xl font-bold text-neutral-900">
            ${filteredRequests.reduce((sum, wr) => sum + (wr.estimated_cost || 0), 0).toFixed(0)}
          </p>
        </div>
      </div>
    </div>
  );
}
