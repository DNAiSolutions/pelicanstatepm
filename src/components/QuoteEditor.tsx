import { useState } from 'react';
import { Plus, Trash2, Save, Send, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Quote, QuoteLineItem, QuoteStatus } from '../data/pipeline';

// Retainer rates
const LABOR_CLASSES = [
  { name: 'Manual Labor', rate: 45, description: 'General labor, cleanup, basic tasks' },
  { name: 'Project Management', rate: 75, description: 'Planning, coordination, supervision' },
  { name: 'Construction Supervision', rate: 85, description: 'Skilled oversight, quality control' },
  { name: 'Skilled Trade', rate: 75, description: 'Electrical, plumbing, carpentry' },
  { name: 'Materials', rate: 0, description: 'Material costs (no labor)' },
  { name: 'Equipment', rate: 0, description: 'Equipment rental, tools' },
];

interface QuoteEditorProps {
  workOrderId: string;
  existingQuote?: Quote;
  onSave: (quote: Partial<Quote>) => Promise<void>;
  onSubmit: (quote: Partial<Quote>) => Promise<void>;
  onCancel: () => void;
}

export function QuoteEditor({
  workOrderId,
  existingQuote,
  onSave,
  onSubmit,
  onCancel,
}: QuoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lineItems, setLineItems] = useState<Partial<QuoteLineItem>[]>(
    existingQuote?.lineItems || [
      { id: `li-new-1`, description: '', laborClass: 'Manual Labor', quantity: 0, unitCost: 45, total: 0 },
    ]
  );

  const [notToExceed, setNotToExceed] = useState<number | undefined>(existingQuote?.notToExceed);
  const [fundingCode, setFundingCode] = useState(existingQuote?.fundingCode || '');
  const [notes, setNotes] = useState(existingQuote?.notes || '');

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `li-new-${Date.now()}`,
        description: '',
        laborClass: 'Manual Labor',
        quantity: 0,
        unitCost: 45,
        total: 0,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) {
      toast.error('Quote must have at least one line item');
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof QuoteLineItem,
    value: string | number
  ) => {
    const updated = [...lineItems];
    const item = { ...updated[index] };

    if (field === 'laborClass') {
      const laborClass = LABOR_CLASSES.find((lc) => lc.name === value);
      item.laborClass = value as string;
      item.unitCost = laborClass?.rate || item.unitCost;
    } else if (field === 'quantity') {
      item.quantity = Number(value) || 0;
    } else if (field === 'unitCost') {
      item.unitCost = Number(value) || 0;
    } else if (field === 'description') {
      item.description = value as string;
    }

    // Recalculate total
    item.total = (item.quantity || 0) * (item.unitCost || 0);
    updated[index] = item;
    setLineItems(updated);
  };

  const handleSave = async () => {
    if (!validateQuote()) return;

    try {
      setIsSaving(true);
      await onSave({
        workOrderId,
        version: existingQuote?.version || 1,
        status: 'Draft' as QuoteStatus,
        lineItems: lineItems as QuoteLineItem[],
        totalEstimate: calculateTotal(),
        notToExceed,
        fundingCode,
        notes,
      });
      toast.success('Quote saved as draft');
    } catch (error) {
      toast.error('Failed to save quote');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateQuote()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        workOrderId,
        version: existingQuote?.version || 1,
        status: 'Submitted' as QuoteStatus,
        lineItems: lineItems as QuoteLineItem[],
        totalEstimate: calculateTotal(),
        notToExceed,
        fundingCode,
        notes,
        submittedAt: new Date().toISOString(),
      });
      toast.success('Quote submitted for approval');
    } catch (error) {
      toast.error('Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateQuote = (): boolean => {
    // Check for empty descriptions
    const hasEmptyDescriptions = lineItems.some((item) => !item.description?.trim());
    if (hasEmptyDescriptions) {
      toast.error('All line items must have a description');
      return false;
    }

    // Check for zero quantities
    const hasZeroQuantities = lineItems.some((item) => !item.quantity || item.quantity <= 0);
    if (hasZeroQuantities) {
      toast.error('All line items must have a quantity greater than 0');
      return false;
    }

    // Check NTE is set and is greater than total
    const total = calculateTotal();
    if (notToExceed && notToExceed < total) {
      toast.error('Not-to-Exceed amount cannot be less than the total estimate');
      return false;
    }

    return true;
  };

  const total = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-neutral-900">
            {existingQuote ? `Edit Quote v${existingQuote.version}` : 'New Quote'}
          </h2>
          <p className="text-neutral-500 text-sm">
            Add line items with labor class, quantity, and rates
          </p>
        </div>
        {existingQuote && (
          <span
            className={`text-xs px-2 py-1 rounded font-medium ${
              existingQuote.status === 'Approved'
                ? 'bg-green-100 text-green-700'
                : existingQuote.status === 'Submitted'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {existingQuote.status}
          </span>
        )}
      </div>

      {/* Line Items Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-neutral-700">Description</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-700 w-40">Labor Class</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700 w-24">Qty</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700 w-28">Unit Cost</th>
                <th className="text-right py-3 px-4 font-medium text-neutral-700 w-28">Total</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {lineItems.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-neutral-50">
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      placeholder="Enter description..."
                      className="w-full px-2 py-1.5 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#143352] text-sm"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <select
                      value={item.laborClass || 'Manual Labor'}
                      onChange={(e) => handleLineItemChange(index, 'laborClass', e.target.value)}
                      className="w-full px-2 py-1.5 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#143352] text-sm"
                    >
                      {LABOR_CLASSES.map((lc) => (
                        <option key={lc.name} value={lc.name}>
                          {lc.name} {lc.rate > 0 && `($${lc.rate}/hr)`}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-2 py-1.5 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#143352] text-sm text-right"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center">
                      <span className="text-neutral-500 mr-1">$</span>
                      <input
                        type="number"
                        value={item.unitCost || ''}
                        onChange={(e) => handleLineItemChange(index, 'unitCost', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1.5 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#143352] text-sm text-right"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-4 text-right font-medium text-neutral-900">
                    ${(item.total || 0).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-center">
                    <button
                      onClick={() => handleRemoveLineItem(index)}
                      className="text-neutral-400 hover:text-red-600 transition-colors"
                      title="Remove line item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-neutral-200 bg-neutral-50">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-right font-medium text-neutral-700">
                  Total Estimate:
                </td>
                <td className="py-3 px-4 text-right text-xl font-bold text-neutral-900">
                  ${total.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={handleAddLineItem}
            className="flex items-center gap-2 text-[#143352] hover:text-[#143352]/80 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Line Item
          </button>
        </div>
      </div>

      {/* NTE and Funding */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card p-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Not-to-Exceed Amount
          </label>
          <div className="flex items-center">
            <span className="text-neutral-500 mr-2">$</span>
            <input
              type="number"
              value={notToExceed || ''}
              onChange={(e) => setNotToExceed(Number(e.target.value) || undefined)}
              placeholder="Enter NTE amount..."
              min={total}
              className="flex-1 px-3 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#143352]"
            />
          </div>
          {notToExceed && notToExceed < total && (
            <p className="text-red-600 text-sm mt-1">NTE must be greater than or equal to total</p>
          )}
          <p className="text-neutral-500 text-xs mt-2">
            Maximum amount that can be invoiced for this work
          </p>
        </div>

        <div className="card p-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Funding Code
          </label>
          <input
            type="text"
            value={fundingCode}
            onChange={(e) => setFundingCode(e.target.value)}
            placeholder="e.g., SHF-2024-001"
            className="w-full px-3 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#143352]"
          />
          <p className="text-neutral-500 text-xs mt-2">
            Reference code for budget allocation
          </p>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes, assumptions, or conditions for this quote..."
          rows={3}
          className="w-full px-3 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#143352]"
        />
      </div>

      {/* Labor Class Reference */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-neutral-500" />
          <h3 className="font-medium text-neutral-700">Retainer Rate Reference</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {LABOR_CLASSES.filter((lc) => lc.rate > 0).map((lc) => (
            <div key={lc.name} className="flex items-center justify-between">
              <span className="text-neutral-600">{lc.name}</span>
              <span className="font-medium text-neutral-900">${lc.rate}/hr</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || total === 0}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
}
