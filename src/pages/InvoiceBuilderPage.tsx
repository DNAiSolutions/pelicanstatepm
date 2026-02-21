import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workRequestService } from '../services/workRequestService';
import { invoiceService } from '../services/invoiceService';
import { propertyService, type Property } from '../services/propertyService';
import { pdfService } from '../services/pdfService';
import type { WorkRequest } from '../types';
import type { InvoiceLineItem } from '../types';
import { AlertCircle, DollarSign, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { InvoiceDetailForm } from '../components/InvoiceDetailForm';

export function InvoiceBuilderPage() {
  const navigate = useNavigate();

  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
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
          propertyService.getProperties(),
        ]);
        setWorkRequests(wr);
        setProperties(c);
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
  const propertiesForInvoice = [...new Set(selectedWorkRequests.map((wr) => wr.property_id))];
  const workRequestLookup = new Map(workRequests.map((wr) => [wr.id, wr]));

  // Toggle work request selection
    const toggleWorkRequest = (requestId: string) => {
      setSelectedRequests((prev) => {
        const next = prev.includes(requestId)
          ? prev.filter((id) => id !== requestId)
          : [...prev, requestId];

      setLineItems((items) => items.filter((item) => !item.work_order_id || next.includes(item.work_order_id)));
      return next;
    });
  };

  // Add line item
  const addLineItemForProperty = (propertyId: string) => {
    const propertyRequests = selectedWorkRequests.filter((wr) => wr.property_id === propertyId);
    if (propertyRequests.length === 0) {
      toast.error('Select a work request for this property first');
      return;
    }

    const defaultRequest = propertyRequests[0];
    setLineItems((current) => [
      ...current,
      {
        description: '',
        location: defaultRequest.property || '',
        work_order_id: defaultRequest.id,
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

      if (field === 'work_order_id' && typeof value === 'string') {
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

  // Get property name
  const getPropertyName = (propertyId: string) => {
    return properties.find((c) => c.id === propertyId)?.name || 'Unknown';
  };

  // Get funding source
  const getFundingSource = (propertyId: string) => {
    return properties.find((c) => c.id === propertyId)?.funding_source || 'Unknown';
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
      work_order_ids: selectedRequests,
      property_id: propertiesForInvoice[0] || '',
      funding_code: getFundingSource(propertiesForInvoice[0]) || '',
      line_items: lineItems,
      total_amount: totalAmount,
      status: 'Draft',
    });

    if (!validation.valid) {
      newErrors.invoice = Object.values(validation.errors).join('; ');
    }

      propertiesForInvoice.forEach((propertyId) => {
      const propertyHasItems = lineItems.some((item) => {
        const wr = workRequestLookup.get(item.work_order_id);
        return wr?.property_id === propertyId;
      });
      if (!propertyHasItems) {
        newErrors.lineItems = `Add at least one line item for ${getPropertyName(propertyId)}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Download PDF preview
  const handleDownloadPDF = async () => {
    try {
      if (propertiesForInvoice.length === 0 || lineItems.length === 0) {
        toast.error('Select work requests and add line items first');
        return;
      }

      const propertyId = propertiesForInvoice[0];
      const propertyName = getPropertyName(propertyId);
      const propertyLineItems = lineItems.filter((item) => {
        const wr = workRequestLookup.get(item.work_order_id);
        return wr?.property_id === propertyId;
      });
      const pdfLineItems = propertyLineItems.map((item) => ({
        work_request_id: item.work_order_id,
        description: item.description,
        location: item.location,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        work_performed_notes: item.work_performed_notes,
      }));
      const propertyTotal = invoiceService.calculateTotal(propertyLineItems);

      await pdfService.generateInvoicePDF(
        {
          invoice_number: `INV-${new Date().getFullYear()}-PREVIEW`,
          property_name: propertyName,
          funding_source: getFundingSource(propertyId),
          line_items: pdfLineItems,
          total_amount: propertyTotal,
        },
        `Invoice-Preview-${propertyName}.pdf`
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

      // Group line items by property
      const invoicesByProperty = new Map<string, any>();

      for (const propertyId of propertiesForInvoice) {
          const propertyLineItems = lineItems.filter((item) => {
            const wr = workRequests.find((w) => w.id === item.work_order_id);
            return wr?.property_id === propertyId;
          });

        if (propertyLineItems.length > 0) {
          const propertyTotal = invoiceService.calculateTotal(propertyLineItems);

          invoicesByProperty.set(propertyId, {
            work_order_ids: selectedRequests.filter((id) => {
              const wr = workRequests.find((w) => w.id === id);
              return wr?.property_id === propertyId;
            }),
            property_id: propertyId,
            funding_code: getFundingSource(propertyId),
            line_items: propertyLineItems,
            total_amount: propertyTotal,
            status: 'Submitted',
            notes,
            submitted_at: new Date().toISOString(),
          });
        }
      }

      // Create invoices
      const createdInvoices = await invoiceService.createSplitInvoices(Array.from(invoicesByProperty.values()));

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
          Select completed work and create invoices by property and funding source
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
                      {wr.property} • {getPropertyName(wr.property_id)} • ${wr.estimated_cost?.toFixed(2) || 'TBD'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Property & Funding Summary */}
        {propertiesForInvoice.length > 0 && (
          <div className="card p-8 bg-blue-50 border-blue-200">
            <h3 className="font-heading font-bold text-neutral-900 mb-3">
              Invoice Summary by Property
            </h3>
            <div className="space-y-2">
              {propertiesForInvoice.map((propertyId) => (
                <div key={propertyId} className="flex justify-between items-center">
                  <span className="font-medium text-neutral-900">{getPropertyName(propertyId)}</span>
                  <span className="text-sm text-neutral-600">{getFundingSource(propertyId)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-neutral-600 mt-4">
              📌 A separate invoice will be created for each property with its own funding source
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
              <p className="text-sm text-neutral-600">Every line item must document what work happened, where, and for which property.</p>
            </div>
          </div>

          {selectedWorkRequests.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>Select completed work requests to start building invoice details.</p>
            </div>
          ) : (
            <InvoiceDetailForm
              properties={properties}
              selectedWorkRequests={selectedWorkRequests}
              lineItems={lineItems}
              onAddItem={addLineItemForProperty}
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
            disabled={propertiesForInvoice.length === 0 || lineItems.length === 0}
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
            <li>Select completed work requests from different properties</li>
            <li>Add line items with details and amounts</li>
            <li>Invoices are automatically split by property and funding source</li>
            <li>Each property gets its own invoice with the correct funding source</li>
            <li>All invoices are submitted and marked "Submitted" status</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
