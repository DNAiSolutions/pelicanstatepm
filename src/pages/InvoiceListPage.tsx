import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceService } from '../services/invoiceService';
import { propertyService, type Property } from '../services/propertyService';
import { pdfService } from '../services/pdfService';
import { Plus, Download, Check, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Invoice } from '../types';

export function InvoiceListPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isMarkingPaid, setIsMarkingPaid] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [invoiceList, propertyList] = await Promise.all([
        invoiceService.getInvoices({}),
        propertyService.getProperties(),
      ]);
      setInvoices(invoiceList || []);
      setProperties(propertyList);
    } catch (error) {
      console.error('Failed to load:', error);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      (inv.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.funding_code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getPropertyName = (propertyId: string) => {
    return properties.find((c) => c.id === propertyId)?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Draft: 'bg-gray-100 text-gray-800',
      Submitted: 'bg-blue-100 text-blue-800',
      Approved: 'bg-purple-100 text-purple-800',
      Paid: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      setIsMarkingPaid(invoiceId);
      await invoiceService.processPayment(invoiceId, { method: 'Check', reference: `manual-${Date.now()}` });
      await loadData();
      toast.success('Invoice marked as paid');
    } catch (error) {
      console.error('Failed to mark paid:', error);
      toast.error('Failed to mark invoice as paid');
    } finally {
      setIsMarkingPaid(null);
    }
  };

    const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      await pdfService.generateInvoicePDF(
        {
          invoice_number: invoice.invoice_number,
          property_name: getPropertyName(invoice.property_id),
          funding_source: invoice.funding_code,
          line_items: invoice.line_items,
          total_amount: invoice.total_amount,
        },
        `${invoice.invoice_number}.pdf`
      );
      toast.success('Invoice PDF downloaded');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading invoices...</p>
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
            Invoices
          </h1>
          <p className="text-neutral-600">
            Manage all invoices and track payments
          </p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="btn-primary inline-flex items-center gap-2 py-3 px-6"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by invoice number or funding source..."
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
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <p>No invoices found</p>
            <button
              onClick={() => navigate('/invoices/new')}
              className="text-primary-600 font-medium hover:text-primary-700 mt-2"
            >
              Create your first invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-neutral-900">Invoice #</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-neutral-900">Property</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-neutral-900">Funding Source</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-neutral-900">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-neutral-900">Amount</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-neutral-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-neutral-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-3 text-sm text-neutral-600">
                      {getPropertyName(invoice.property_id)}
                    </td>
                    <td className="px-6 py-3 text-sm text-neutral-600">
                      {invoice.funding_code}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-3 py-1 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-neutral-900 text-right">
                      ${invoice.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-neutral-100 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {invoice.status !== 'Paid' && (
                          <button
                            onClick={() => handleMarkPaid(invoice.id!)}
                            disabled={isMarkingPaid === invoice.id!}
                            className="p-2 text-neutral-600 hover:text-green-600 hover:bg-neutral-100 transition-colors disabled:opacity-50"
                            title="Mark as paid"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
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
          <p className="text-sm text-neutral-600">Total Invoices</p>
          <p className="text-2xl font-bold text-neutral-900">{filteredInvoices.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-600">Pending</p>
          <p className="text-2xl font-bold text-neutral-900">
            {filteredInvoices.filter(inv => ['Submitted', 'Approved'].includes(inv.status)).length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-600">Paid</p>
          <p className="text-2xl font-bold text-neutral-900">
            {filteredInvoices.filter(inv => inv.status === 'Paid').length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-600">Total Value</p>
          <p className="text-2xl font-bold text-neutral-900">
            ${filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0).toFixed(0)}
          </p>
        </div>
      </div>
    </div>
  );
}
