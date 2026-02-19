import { DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface DashboardMetricsData {
  activeValue: number;
  invoicedValue: number;
  completedCount: number;
  inProgressCount: number;
  awaitingApprovalCount: number;
  blockedCount: number;
  totalWorkOrders: number;
}

interface DashboardMetricsProps {
  metrics: DashboardMetricsData;
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Work Value */}
      <div className="bg-white border border-neutral-200 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-600 uppercase">Active Work Value</h3>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <p className="text-3xl font-bold text-neutral-900 mb-1">
          ${(metrics.activeValue / 1000).toFixed(0)}k
        </p>
        <p className="text-sm text-neutral-500">Active pipeline</p>
      </div>

      {/* In Progress */}
      <div className="bg-white border border-neutral-200 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-600 uppercase">In Progress</h3>
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <p className="text-3xl font-bold text-neutral-900 mb-1">{metrics.inProgressCount}</p>
        <p className="text-sm text-neutral-500">Work orders being executed</p>
      </div>

      {/* Awaiting Approval */}
      <div className="bg-white border border-neutral-200 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-600 uppercase">Awaiting Approval</h3>
          <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
        <p className="text-3xl font-bold text-neutral-900 mb-1">{metrics.awaitingApprovalCount}</p>
        <p className="text-sm text-neutral-500">Quotes needing review</p>
      </div>

      {/* Completed */}
      <div className="bg-white border border-neutral-200 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-600 uppercase">Completed</h3>
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <p className="text-3xl font-bold text-neutral-900 mb-1">{metrics.completedCount}</p>
        <p className="text-sm text-neutral-500">Ready for invoicing</p>
      </div>
    </div>
  );
}
