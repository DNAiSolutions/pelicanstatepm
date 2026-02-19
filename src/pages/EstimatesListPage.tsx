import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Plus, Search } from 'lucide-react';
import { useProfileData } from '../hooks/useProfileData';

import {
  getWorkOrderById,
  getSiteById,
  getCampusById,
  type QuoteStatus,
} from '../data/pipeline';

const statusOptions: QuoteStatus[] = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Superseded'];

export function EstimatesListPage() {
  const navigate = useNavigate();
  const { quotes: mockQuotes } = useProfileData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredQuotes = useMemo(() => {
    return mockQuotes.filter((quote) => {
      const workOrder = getWorkOrderById(quote.workOrderId);
      const site = workOrder ? getSiteById(workOrder.siteId) : null;
      const campus = site ? getCampusById(site.campusId) : null;

      const matchesSearch =
        quote.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workOrder?.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workOrder?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campus?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || quote.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Pelican State Estimates</p>
          <h1 className="text-3xl font-heading font-bold text-neutral-900">Quotes & Estimates</h1>
        </div>
        <button
          onClick={() => navigate('/work-requests')}
          className="flex items-center gap-2 bg-[#143352] text-white px-4 py-2.5 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Work Order
        </button>
      </div>

      <div className="bg-white border border-neutral-200 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-neutral-600 text-sm">
          <Filter className="w-4 h-4" />
          Filter quotes by status or campus
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search quotes or work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#143352]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#143352]"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Quote
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Work Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Total Estimate
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredQuotes.map((quote) => {
                const workOrder = getWorkOrderById(quote.workOrderId);
                const site = workOrder ? getSiteById(workOrder.siteId) : null;
                const campus = site ? getCampusById(site.campusId) : null;

                return (
                  <tr key={quote.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">{quote.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-neutral-900">{workOrder?.requestNumber}</p>
                      <p className="text-xs text-neutral-500 truncate max-w-xs">{workOrder?.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="text-neutral-900">{site?.name}</p>
                      <p className="text-xs text-neutral-500">{campus?.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">v{quote.version}</td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                      ${quote.totalEstimate.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 font-medium ${
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
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/work-requests/${quote.workOrderId}`)}
                        className="text-sm text-[#143352] hover:underline"
                      >
                        View Work Order
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
