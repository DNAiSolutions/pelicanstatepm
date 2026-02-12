import type { InvoiceLineItem, WorkRequest } from '../types';
import type { Campus } from '../services/campusService';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  campuses: Campus[];
  selectedWorkRequests: WorkRequest[];
  lineItems: InvoiceLineItem[];
  onAddItem: (campusId: string) => void;
  onUpdateItem: (index: number, field: keyof InvoiceLineItem, value: any) => void;
  onRemoveItem: (index: number) => void;
  errors?: string;
}

export function InvoiceDetailForm({
  campuses,
  selectedWorkRequests,
  lineItems,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  errors,
}: Props) {
  const campusLookup = new Map(campuses.map((campus) => [campus.id, campus]));
  const workRequestLookup = new Map(selectedWorkRequests.map((wr) => [wr.id, wr]));

  const campusGroups = selectedWorkRequests.reduce<Record<string, WorkRequest[]>>((acc, wr) => {
    acc[wr.campus_id] = acc[wr.campus_id] ? [...acc[wr.campus_id], wr] : [wr];
    return acc;
  }, {});

  const lineItemsWithIndex = lineItems.map((item, index) => ({ item, index }));

  const unassignedItems = lineItemsWithIndex.filter(
    ({ item }) => !item.work_request_id || !workRequestLookup.get(item.work_request_id)
  );

  return (
    <div className="space-y-8">
      {errors && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errors}
        </div>
      )}

      {Object.entries(campusGroups).map(([campusId, requests]) => {
        const campus = campusLookup.get(campusId);
        const campusLineItems = lineItemsWithIndex.filter(({ item }) => {
          const wr = workRequestLookup.get(item.work_request_id);
          return wr?.campus_id === campusId;
        });

        return (
          <div key={campusId} className="border border-neutral-200 p-6 bg-neutral-50 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xl font-heading font-bold text-neutral-900">
                  {campus?.name || 'Campus'} Invoice Details
                </p>
                <p className="text-sm text-neutral-600">Funding Source: {campus?.funding_source || 'N/A'}</p>
              </div>
              <button
                type="button"
                onClick={() => onAddItem(campusId)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Add Line Item
              </button>
            </div>

            {campusLineItems.length === 0 ? (
              <div className="p-4 bg-white border border-dashed border-neutral-300 text-sm text-neutral-600">
                No line items yet. Add work performed for {campus?.name}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="py-3 px-4">Work Request</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Qty</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Rate ($)</th>
                      <th className="py-3 px-4">Amount ($)</th>
                      <th className="py-3 px-4">Work Performed</th>
                      <th className="py-3 px-4 text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campusLineItems.map(({ item, index }) => (
                      <tr key={`${campusId}-${index}`} className="border-b border-neutral-200">
                        <td className="py-3 px-4">
                          <select
                            value={item.work_request_id}
                            onChange={(e) => onUpdateItem(index, 'work_request_id', e.target.value)}
                            className="w-full border border-neutral-300 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Select...</option>
                            {requests.map((wr) => (
                              <option key={wr.id} value={wr.id}>
                                {wr.request_number} – {wr.property}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => onUpdateItem(index, 'description', e.target.value)}
                            placeholder="Labor performed"
                            className="w-full border border-neutral-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={item.location || ''}
                            onChange={(e) => onUpdateItem(index, 'location', e.target.value)}
                            placeholder="Building / area"
                            className="w-full border border-neutral-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={item.quantity}
                            min="0"
                            step="0.25"
                            onChange={(e) => onUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20 border border-neutral-300 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => onUpdateItem(index, 'unit', e.target.value)}
                            className="w-24 border border-neutral-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={item.rate}
                            min="0"
                            step="0.01"
                            onChange={(e) => onUpdateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-28 border border-neutral-300 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={item.amount}
                            readOnly
                            className="w-28 border border-neutral-300 px-2 py-1 text-right bg-neutral-100"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <textarea
                            value={item.work_performed_notes || ''}
                            onChange={(e) => onUpdateItem(index, 'work_performed_notes', e.target.value)}
                            rows={2}
                            className="w-64 border border-neutral-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Detail what work was actually performed"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onRemoveItem(index)}
                            className="text-red-600 hover:text-red-700"
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
        );
      })}

      {unassignedItems.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <div>
            <p className="font-semibold">Assign work requests to all line items</p>
            <p>Some line items are not tied to a work request yet. Select a work request so the invoice can route to the correct campus.</p>
          </div>
        </div>
      )}
    </div>
  );
}
