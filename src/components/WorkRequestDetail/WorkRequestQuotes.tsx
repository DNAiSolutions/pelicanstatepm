import { DollarSign } from 'lucide-react';
import type { Quote } from '../../data/pipeline';

interface WorkRequestQuotesProps {
  quotes: Quote[];
  onNewQuoteClick: () => void;
  onApproveQuote: (quoteId: string) => void;
  onRequestChanges: (quoteId: string) => void;
}

export function WorkRequestQuotes({
  quotes,
  onNewQuoteClick,
  onApproveQuote,
  onRequestChanges,
}: WorkRequestQuotesProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-neutral-900">Quotes & Estimates</h2>
        <button onClick={onNewQuoteClick} className="btn-primary text-sm">
          New Quote
        </button>
      </div>

      {quotes.length === 0 ? (
        <div className="card p-8 text-center">
          <DollarSign className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No quotes created yet.</p>
          <button onClick={onNewQuoteClick} className="btn-primary">
            Create First Quote
          </button>
        </div>
      ) : (
        quotes.map((quote) => (
          <div
            key={quote.id}
            className={`card p-6 ${quote.status === 'Approved' ? 'border-l-4 border-green-500' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-neutral-900">Quote v{quote.version}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
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
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  Created {new Date(quote.createdAt).toLocaleDateString()}
                  {quote.approvedAt && ` - Approved ${new Date(quote.approvedAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-neutral-900">
                  ${quote.totalEstimate.toLocaleString()}
                </p>
                {quote.notToExceed && (
                  <p className="text-sm text-neutral-500">NTE: ${quote.notToExceed.toLocaleString()}</p>
                )}
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200">
                <tr>
                  <th className="text-left py-2 font-medium text-neutral-600">Description</th>
                  <th className="text-left py-2 font-medium text-neutral-600">Labor Class</th>
                  <th className="text-right py-2 font-medium text-neutral-600">Qty</th>
                  <th className="text-right py-2 font-medium text-neutral-600">Unit</th>
                  <th className="text-right py-2 font-medium text-neutral-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {quote.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-neutral-900">{item.description}</td>
                    <td className="py-2 text-neutral-600">{item.laborClass}</td>
                    <td className="py-2 text-right text-neutral-900">{item.quantity}</td>
                    <td className="py-2 text-right text-neutral-600">${item.unitCost}</td>
                    <td className="py-2 text-right font-medium text-neutral-900">
                      ${item.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {quote.fundingCode && (
              <p className="mt-4 text-sm text-neutral-500">Funding Code: {quote.fundingCode}</p>
            )}

            {quote.status === 'Submitted' && (
              <div className="mt-4 flex gap-2">
                <button
                  className="btn-primary text-sm"
                  onClick={() => onApproveQuote(quote.id)}
                >
                  Approve Quote
                </button>
                <button
                  className="btn-secondary text-sm"
                  onClick={() => onRequestChanges(quote.id)}
                >
                  Request Changes
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
