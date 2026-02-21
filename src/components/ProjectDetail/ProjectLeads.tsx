import { Plus } from 'lucide-react';
import type { Lead } from '../../types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export interface ProjectLeadsProps {
  leads: Lead[];
  onAddLead?: () => void;
  onLeadClick?: (lead: Lead) => void;
}

export function ProjectLeads({ leads, onAddLead, onLeadClick }: ProjectLeadsProps) {
  return (
    <div className="bg-white border border-neutral-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-semibold text-neutral-900">Pipeline Leads</h3>
          <p className="text-sm text-neutral-500">{leads.length} linked</p>
        </div>
        {onAddLead && (
          <button
            onClick={onAddLead}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#0f2749] rounded-lg hover:bg-[#0f2749]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        )}
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-neutral-500">No leads yet.</p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="border border-neutral-200 p-3 rounded hover:bg-neutral-50 cursor-pointer transition-colors"
              onClick={() => onLeadClick?.(lead)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{lead.company_name}</p>
                  <p className="text-xs text-neutral-500">Stage: {lead.stage}</p>
                </div>
                <span className="text-sm font-semibold text-neutral-900">{formatCurrency(lead.estimated_value ?? 0)}</span>
              </div>
              <p className="text-sm text-neutral-600 mt-2">Next: {lead.recommended_next_step || 'TBD'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
