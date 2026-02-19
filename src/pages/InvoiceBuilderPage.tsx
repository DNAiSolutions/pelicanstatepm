import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workRequestService } from '../services/workRequestService';
import { invoiceService } from '../services/invoiceService';
import { campusService, type Campus } from '../services/campusService';
import { pdfService } from '../services/pdfService';
import type { WorkRequest, InvoiceLineItem } from '../types';
import { AlertCircle, DollarSign, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { InvoiceDetailForm } from '../components/InvoiceDetailForm';

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
  const workRequestLookup = new Map(workRequests.map((wr) => [wr.id, wr]));

  // Toggle work request selection
  const toggleWorkRequest = (requestId: string) => {
    setSelectedRequests((prev) => {
      const next = prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId];

      setLineItems((items) => items.filter((item) => !item.work_request_id || next.includes(item.work_request_id)));
      return next;
    });
  };

  // Add line item
  const addLineItemForCampus = (campusId: string) => {
    const campusRequests = selectedWorkRequests.filter((wr) => wr.campus_id === campusId);
    if (campusRequests.length === 0) {
      toast.error('Select a work request for this campus first');
      return;
    }

    const defaultRequest = campusRequests[0];
    setLineItems((current) => [
      ...current,
      {
        description: '',
        location: defaultRequest.property || '',
        work_request_id: defaultRequest.id,
        quantity: 1,
        unit: 'hrs',
        rate: 0,
        amount: 0,
        work_performed_notes: '',
      },
    ]);
  };

  // Update line item
  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    setLineItems((current) => {
      const updated = [...current];
      const nextItem = { ...updated[index], [field]: value } as InvoiceLineItem;

      if (field === 'work_request_id' && typeof value === 'string') {
        const wr = workRequestLookup.get(value);
        nextItem.location = wr?.property || '';
      }

      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? value : nextItem.quantity;
        const rate = field === 'rate' ? value : nextItem.rate;
        nextItem.amount = Number((qty || 0) * (rate || 0));
      }

      updated[index] = nextItem;
      return updated;
    });
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

    campusesForInvoice.forEach((campusId) => {
      const campusHasItems = lineItems.some((item) => {
        const wr = workRequestLookup.get(item.work_request_id);
        return wr?.campus_id === campusId;
      });
      if (!campusHasItems) {
        newErrors.lineItems = `Add at least one line item for ${getCampusName(campusId)}`;
      }
    });

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
      const campusLineItems = lineItems.filter((item) => {
        const wr = workRequestLookup.get(item.work_request_id);
        return wr?.campus_id === campusId;
      });
      const campusTotal = invoiceService.calculateTotal(campusLineItems);

      await pdfService.generateInvoicePDF(
        {
          invoice_number: `INV-${new Date().getFullYear()}-PREVIEW`,
          campus_name: campusName,
          funding_source: getFundingSource(campusId),
          line_items: campusLineItems,
          total_amount: campusTotal,
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
        <div className="card p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-heading font-bold text-neutral-900">
                Step 2: Detailed Line Items
              </h2>
              <p className="text-sm text-neutral-600">Every line item must document what work happened, where, and for which campus.</p>
            </div>
          </div>

          {selectedWorkRequests.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>Select completed work requests to start building invoice details.</p>
            </div>
          ) : (
            <InvoiceDetailForm
              campuses={campuses}
              selectedWorkRequests={selectedWorkRequests}
              lineItems={lineItems}
              onAddItem={addLineItemForCampus}
              onUpdateItem={updateLineItem}
              onRemoveItem={removeLineItem}
              errors={errors.lineItems || errors.invoice}
            />
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
