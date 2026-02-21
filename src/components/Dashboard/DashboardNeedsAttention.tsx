import { AlertTriangle, DollarSign, ArrowRight } from 'lucide-react';
import type { WorkOrder, Invoice } from '../../data/pipeline';
import { getSiteById } from '../../data/pipeline';

interface DashboardNeedsAttentionProps {
  blockedWorkOrders: WorkOrder[];
  awaitingApprovalWorkOrders: WorkOrder[];
  recentInvoices: Invoice[];
  onWorkOrderClick: (id: string) => void;
  onInvoiceClick: (id: string) => void;
  onViewAllInvoicesClick: () => void;
}

export function DashboardNeedsAttention({
  blockedWorkOrders,
  awaitingApprovalWorkOrders,
  recentInvoices,
  onWorkOrderClick,
  onInvoiceClick,
  onViewAllInvoicesClick,
}: DashboardNeedsAttentionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Needs Attention Panel */}
      <div className="bg-white border border-neutral-200 p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-heading font-bold text-neutral-900">Needs Attention</h2>
        </div>

        {/* Blocked Items */}
        {blockedWorkOrders.length > 0 && (
          <div className="mb-6 pb-6 border-b border-neutral-200">
            <p className="text-sm font-semibold text-red-700 mb-3">Blocked Items ({blockedWorkOrders.length})</p>
            <div className="space-y-2">
              {blockedWorkOrders.map((wo) => {
                const site = getSiteById(wo.siteId);
                return (
                  <button
                    key={wo.id}
                    onClick={() => onWorkOrderClick(wo.id)}
                    className="w-full flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors text-left"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{wo.requestNumber}</p>
                      <p className="text-xs text-neutral-600">{site?.name || 'N/A'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Awaiting Approval */}
        {awaitingApprovalWorkOrders.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-yellow-700 mb-3">
              Awaiting Approval ({awaitingApprovalWorkOrders.length})
            </p>
            <div className="space-y-2">
              {awaitingApprovalWorkOrders.slice(0, 3).map((wo) => {
                const site = getSiteById(wo.siteId);
                return (
                  <button
                    key={wo.id}
                    onClick={() => onWorkOrderClick(wo.id)}
                    className="w-full flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors text-left"
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-600 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{wo.requestNumber}</p>
                      <p className="text-xs text-neutral-600">{site?.name || 'N/A'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {blockedWorkOrders.length === 0 && awaitingApprovalWorkOrders.length === 0 && (
          <p className="text-center text-neutral-500 py-6">All items on track</p>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="bg-white border border-neutral-200 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-heading font-bold text-neutral-900">Recent Invoices</h2>
          </div>
          <button
            onClick={onViewAllInvoicesClick}
            className="text-sm text-[#0f2749] hover:text-[#0f2749]/80 font-medium"
          >
            View All →
          </button>
        </div>

        <div className="space-y-3">
          {recentInvoices.length > 0 ? (
            recentInvoices.map((invoice) => (
              <button
                key={invoice.id}
                onClick={() => onInvoiceClick(invoice.id)}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded hover:bg-neutral-100 transition-colors"
              >
                <div className="text-left flex-1">
                  <p className="font-medium text-neutral-900">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-neutral-500">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right mr-2">
                  <p className="font-semibold text-neutral-900">
                    ${invoice.totalAmount.toLocaleString()}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      invoice.status === 'Paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400" />
              </button>
            ))
          ) : (
            <p className="text-center text-neutral-500 py-6">No recent invoices</p>
          )}
        </div>
      </div>
    </div>
  );
}
