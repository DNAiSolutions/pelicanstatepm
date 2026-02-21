import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workRequestService } from '../services/workRequestService';
import { estimateService, type LineItem } from '../services/estimateService';
import { pdfService } from '../services/pdfService';
import type { WorkRequest } from '../types';
import { Plus, Trash2, AlertCircle, CheckCircle, DollarSign, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export function EstimateBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workRequest, setWorkRequest] = useState<WorkRequest | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [notToExceed, setNotToExceed] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load work request
  useEffect(() => {
    const loadWorkRequest = async () => {
      if (!id) {
        toast.error('No work request ID provided');
        navigate('/dashboard');
        return;
      }

      try {
        setIsLoading(true);
        const wr = await workRequestService.getWorkRequest(id);
        setWorkRequest(wr);

        // Load existing estimate if available
        const estimate = await estimateService.getEstimate(id);
        if (estimate) {
          setLineItems(estimate.line_items || []);
          setNotToExceed(estimate.not_to_exceed);
          setNotes(estimate.notes || '');
        }
      } catch (error) {
        console.error('Failed to load work request:', error);
        toast.error('Failed to load work request');
        navigate('/work-requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkRequest();
  }, [id, navigate]);

  const totalAmount = estimateService.calculateTotal(lineItems);
  const isOverBudget = notToExceed && totalAmount > notToExceed;

  // Add line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', amount: 0, quantity: 1 },
    ]);
  };

  // Update line item
  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const validation = estimateService.validateLineItems(lineItems);
    if (!validation.valid) {
      newErrors.lineItems = validation.errors.join('; ');
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (lineItems.length === 0) {
      toast.error('Add at least one line item');
      return;
    }

    try {
      setIsSaving(true);
      await estimateService.saveDraft(workRequest!.id, lineItems, totalAmount, notes);
      toast.success('Estimate saved as draft');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for approval
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create or update estimate
      const existing = await estimateService.getEstimate(workRequest!.id);

      if (existing) {
        await estimateService.updateEstimate(existing.id, {
          line_items: lineItems,
          total_amount: totalAmount,
          not_to_exceed: notToExceed,
          notes,
          status: 'Submitted',
        });
      } else {
        await estimateService.createEstimate({
          work_request_id: workRequest!.id,
          line_items: lineItems,
          total_amount: totalAmount,
          not_to_exceed: notToExceed,
          notes,
          status: 'Submitted',
        });
      }

      // Update work request status to Approval
      await workRequestService.updateWorkRequestStatus(workRequest!.id, 'Approval');

      toast.success('Estimate submitted for approval!');
      navigate(`/work-requests/${workRequest!.id}`);
    } catch (error) {
      console.error('Failed to submit estimate:', error);
      toast.error('Failed to submit estimate');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      if (!workRequest) return;
      
      await pdfService.generateEstimatePDF(
        {
          id: `EST-${workRequest.id.substring(0, 8)}`,
          work_request_number: workRequest.request_number,
          line_items: lineItems,
          total_amount: totalAmount,
          not_to_exceed: notToExceed,
          notes,
        },
        `Estimate-${workRequest.request_number}.pdf`
      );
      toast.success('PDF downloaded');
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
          <p className="text-neutral-600">Loading work request...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-primary-900 mb-2">
          Create Estimate
        </h1>
        <p className="text-neutral-600">
          {workRequest?.request_number} - {workRequest?.property}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Line Items */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-neutral-900">
              Line Items
            </h2>
            <button
              type="button"
              onClick={addLineItem}
              className="btn-primary inline-flex items-center gap-2"
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
              <p>No line items yet. Click "Add Item" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-4 items-end p-4 bg-neutral-50 border border-neutral-200"
                >
                  {/* Description */}
                  <div className="col-span-6">
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="e.g., Labor, Materials, Equipment"
                      className="w-full px-3 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Amount */}
                  <div className="col-span-4">
                    <label className="text-xs font-medium text-neutral-600 mb-1 block">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => updateLineItem(index, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Delete */}
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="w-full btn-secondary py-2 px-3 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="card p-8 space-y-4">
          <div className="flex justify-between items-center text-lg font-medium">
            <span>Subtotal:</span>
            <span className="font-heading text-2xl text-primary-900">${totalAmount.toFixed(2)}</span>
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <label htmlFor="not_to_exceed" className="block text-sm font-medium text-neutral-900 mb-2">
              Not-to-Exceed Amount (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-neutral-500">$</span>
              <input
                id="not_to_exceed"
                type="number"
                value={notToExceed || ''}
                onChange={(e) => setNotToExceed(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Leave blank for no limit"
                step="0.01"
                min="0"
                className={`w-full pl-7 pr-4 py-2 border ${
                  isOverBudget ? 'border-red-300 bg-red-50' : 'border-neutral-300 bg-white'
                } text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500`}
              />
            </div>
          </div>

          {isOverBudget && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Estimate exceeds not-to-exceed amount by ${(totalAmount - notToExceed!).toFixed(2)}
            </div>
          )}
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
            placeholder="Add any additional notes about this estimate..."
            rows={4}
            className="w-full px-4 py-2 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 btn-primary py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Submit for Approval
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="btn-secondary py-3 px-6 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={lineItems.length === 0}
            className="btn-secondary py-3 px-6 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>

          <button
            type="button"
            onClick={() => navigate(`/work-requests/${workRequest!.id}`)}
            className="btn-secondary py-3 px-6 font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Summary Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 text-sm text-blue-700 space-y-2">
          <p className="font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Estimate Summary
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Total: ${totalAmount.toFixed(2)}</li>
            <li>Click "Submit for Approval" to send to client</li>
            <li>Client must approve before work can begin</li>
            <li>You can save as draft and come back later</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
