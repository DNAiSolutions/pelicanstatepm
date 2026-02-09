import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workRequestService } from '../services/workRequestService';
import { invoiceService, type InvoiceLineItem } from '../services/invoiceService';
import { campusService, type Campus } from '../services/campusService';
import { pdfService } from '../services/pdfService';
import type { WorkRequest } from '../types';
import { Plus, Trash2, AlertCircle, DollarSign, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export function InvoiceBuilderPage() {
  const navigate = useNavigate();

  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [wr, c] = await Promise.all([
          workRequestService.getWorkRequests({ status: 'Complete' }),
          campusService.getCampuses(),
        ]);
        setWorkRequests(wr);
        setCampuses(c);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const totalAmount = invoiceService.calculateTotal(lineItems);
  const selectedWorkRequests = workRequests.filter((wr) => selectedRequests.includes(wr.id));
  const campusesForInvoice = [...new Set(selectedWorkRequests.map((wr) => wr.campus_id))];

  // Toggle work request selection
  const toggleWorkRequest = (requestId: string) => {
    setSelectedRequests((prev) =>
      prev.includes(requestId) ? prev.filter((id) => id !== requestId) : [...prev, requestId]
    );
  };

  // Add line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', location: '', amount: 0, work_request_id: selectedWorkRequests[0]?.id || '' },
    ]);
  };

  // Update line item
  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Get campus name
  const getCampusName = (campusId: string) => {
    return campuses.find((c) => c.id === campusId)?.name || 'Unknown';
  };

  // Get funding source
  const getFundingSource = (campusId: string) => {
    return campuses.find((c) => c.id === campusId)?.funding_source || 'Unknown';
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedRequests.length === 0) {
      newErrors.workRequests = 'Select at least one work request';
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = 'Add at least one line item';
    }

    const validation = invoiceService.validateInvoice({
      work_request_ids: selectedRequests,
      campus_id: campusesForInvoice[0] || '',
      funding_source: getFundingSource(campusesForInvoice[0]) || '',
      line_items: lineItems,
      total_amount: totalAmount,
      status: 'Draft',
    });

    if (!validation.valid) {
      newErrors.invoice = validation.errors.join('; ');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Download PDF preview
  const handleDownloadPDF = async () => {
    try {
      if (campusesForInvoice.length === 0 || lineItems.length === 0) {
        toast.error('Select work requests and add line items first');
        return;
      }

      const campusId = campusesForInvoice[0];
      const campusName = getCampusName(campusId);

      await pdfService.generateInvoicePDF(
        {
          invoice_number: `INV-${new Date().getFullYear()}-PREVIEW`,
          campus_name: campusName,
          funding_source: getFundingSource(campusId),
          line_items: lineItems,
          total_amount: totalAmount,
        },
        `Invoice-Preview-${campusName}.pdf`
      );
      toast.success('Invoice preview downloaded');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate invoice PDF');
    }
  };

  // Submit invoices
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    try {
      setIsSubmitting(true);

      // Group line items by campus
      const invoicesByCampus = new Map<string, any>();

      for (const campusId of campusesForInvoice) {
        const campusLineItems = lineItems.filter((item) => {
          const wr = workRequests.find((w) => w.id === item.work_request_id);
          return wr?.campus_id === campusId;
        });

        if (campusLineItems.length > 0) {
          const campusTotal = invoiceService.calculateTotal(campusLineItems);

          invoicesByCampus.set(campusId, {
            work_request_ids: selectedRequests.filter((id) => {
              const wr = workRequests.find((w) => w.id === id);
              return wr?.campus_id === campusId;
            }),
            campus_id: campusId,
            funding_source: getFundingSource(campusId),
            line_items: campusLineItems,
            total_amount: campusTotal,
            status: 'Submitted',
            notes,
            submitted_at: new Date().toISOString() as any,
          });
        }
      }

      // Create invoices
      const createdInvoices = await invoiceService.createSplitInvoices(invoicesByCampus);

      toast.success(`${createdInvoices.length} invoice(s) created and submitted!`);
      navigate('/invoices');
    } catch (error) {
      console.error('Failed to create invoices:', error);
      toast.error('Failed to create invoices');
    } finally {
      setIsSubmitting(false);
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
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-primary-900 mb-2">
          Create Invoice
        </h1>
        <p className="text-neutral-600">
          Select completed work and create invoices by campus and funding source
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Work Requests */}
        <div className="card p-8">
          <h2 className="text-2xl font-heading font-bold text-neutral-900 mb-6">
            Step 1: Select Work Requests
          </h2>

          {errors.workRequests && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.workRequests}
            </div>
          )}

          {workRequests.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>No completed work requests available.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {workRequests.map((wr) => (
                <label
                  key={wr.id}
                  className="flex items-center gap-3 p-4 border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRequests.includes(wr.id)}
                    onChange={() => toggleWorkRequest(wr.id)}
                    className="w-4 h-4 accent-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900">{wr.request_number}</p>
                    <p className="text-sm text-neutral-600">
                      {wr.property} • {getCampusName(wr.campus_id)} • ${wr.estimated_cost?.toFixed(2) || 'TBD'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Campus & Funding Summary */}
        {campusesForInvoice.length > 0 && (
          <div className="card p-8 bg-blue-50 border-blue-200">
            <h3 className="font-heading font-bold text-neutral-900 mb-3">
              Invoice Summary by Campus
            </h3>
            <div className="space-y-2">
              {campusesForInvoice.map((campusId) => (
                <div key={campusId} className="flex justify-between items-center">
                  <span className="font-medium text-neutral-900">{getCampusName(campusId)}</span>
                  <span className="text-sm text-neutral-600">{getFundingSource(campusId)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-600 mt-4">
              📌 A separate invoice will be created for each campus with its own funding source
            </p>
          </div>
        )}

        {/* Line Items */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-neutral-900">
              Step 2: Line Items
            </h2>
            <button
              type="button"
              onClick={addLineItem}
              disabled={selectedRequests.length === 0}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          </div>

          {errors.lineItems && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.lineItems}
            </div>
          )}

          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>No line items yet. Select work requests and click "Add Item".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-neutral-300">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-neutral-900">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-900">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-900">Work Request</th>
                    <th className="text-right py-3 px-4 font-medium text-neutral-900">Amount</th>
                    <th className="text-center py-3 px-4 font-medium text-neutral-900">Action</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {lineItems.map((item, index) => (
                    <tr key={index} className="border-b border-neutral-200">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="Description of work"
                          className="w-full px-2 py-1 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.location}
                          onChange={(e) => updateLineItem(index, 'location', e.target.value)}
                          placeholder="Property/location"
                          className="w-full px-2 py-1 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={item.work_request_id}
                          onChange={(e) => updateLineItem(index, 'work_request_id', e.target.value)}
                          className="w-full px-2 py-1 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Select...</option>
                          {selectedWorkRequests.map((wr) => (
                            <option key={wr.id} value={wr.id}>
                              {wr.request_number}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={item.amount || ''}
                          onChange={(e) => updateLineItem(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-2 py-1 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-right"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="card p-8 space-y-4">
          <div className="flex justify-between items-center text-lg font-medium">
            <span>Total Amount:</span>
            <span className="font-heading text-3xl text-primary-900">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-8">
          <label htmlFor="notes" className="block text-sm font-medium text-neutral-900 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes to the invoice..."
            rows={4}
            className="w-full px-4 py-2 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || lineItems.length === 0}
            className="flex-1 btn-primary py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Create & Submit Invoice(s)
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={campusesForInvoice.length === 0 || lineItems.length === 0}
            className="btn-secondary py-3 px-6 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Preview PDF
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary py-3 px-6 font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 text-sm text-blue-700 space-y-2">
          <p className="font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            How It Works
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Select completed work requests from different campuses</li>
            <li>Add line items with details and amounts</li>
            <li>Invoices are automatically split by campus and funding source</li>
            <li>Each campus gets its own invoice with the correct funding source</li>
            <li>All invoices are submitted and marked "Submitted" status</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
