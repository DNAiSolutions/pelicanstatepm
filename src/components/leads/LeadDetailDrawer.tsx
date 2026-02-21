import { useEffect, useState } from 'react';
import { LEAD_NEXT_STEP_LABELS, type Lead } from '../../types';
import { useNavigate } from 'react-router-dom';
import { leadService } from '../../services/leadService';

type LeadDetailDrawerProps = {
  lead: Lead | null;
  onClose: () => void;
  onDelete?: (leadId: string) => void;
  onLeadUpdated?: (lead: Lead) => void;
};

export function LeadDetailDrawer({ lead, onClose, onDelete }: LeadDetailDrawerProps) {
  const [tab, setTab] = useState<'Summary' | 'Intake'>('Summary');
  const [history, setHistory] = useState<any[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      if (!lead) {
        setHistory([]);
        return;
      }
      try {
        const records = await leadService.listIntakeHistory(lead.id);
        if (isMounted) {
          setHistory(records);
        }
      } catch (err) {
        console.error('Load history error:', err);
        if (isMounted) {
          setHistory([]);
        }
      }
    }
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [lead]);

  if (!lead) return null;

  const intake = lead.intake_metadata;
  const recommendedLabel = lead.recommended_next_step ? LEAD_NEXT_STEP_LABELS[lead.recommended_next_step] || lead.recommended_next_step : 'Review';

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-neutral-200 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Lead Detail</p>
            <h3 className="text-xl font-heading font-semibold text-neutral-900">{lead.company_name}</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onDelete?.(lead.id)}
              className="text-xs uppercase tracking-[0.3em] text-rose-600"
            >
              Delete
            </button>
            {lead.walkthrough_scheduled && (
              <button
                onClick={() => navigate(`/walkthroughs/new/${lead.id}`)}
                className="text-xs uppercase tracking-[0.3em] text-[#0f2749]"
              >
                Open Walkthrough
              </button>
            )}
            <button onClick={onClose} className="text-sm text-neutral-500">Close</button>
          </div>
        </div>
        <div className="flex gap-4 px-6 py-3 border-b border-neutral-100 text-sm">
          {['Summary', 'Intake'].map((label) => (
            <button
              key={label}
              onClick={() => setTab(label as 'Summary' | 'Intake')}
              className={`pb-1 ${tab === label ? 'text-[#0f2749] border-b-2 border-[#0f2749]' : 'text-neutral-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm text-neutral-700">
          {tab === 'Summary' ? (
            <>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Contact</p>
                <p className="text-neutral-900 font-medium">{lead.contact_name} · {lead.phone}</p>
                <p>{lead.email}</p>
                {lead.preferred_channel && <p className="text-xs text-neutral-500">Prefers {lead.preferred_channel}</p>}
              </div>
              {lead.walkthrough_prep_brief && (
                <div className="border border-neutral-200 p-3 rounded">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Prep Brief</p>
                  <p className="text-sm text-neutral-900 font-semibold">{lead.project_type || 'General Construction'}</p>
                  <p className="text-xs text-neutral-600">{lead.walkthrough_prep_brief.summary}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Stage</p>
                  <p className="text-neutral-900 font-medium">{lead.stage}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Channel</p>
                  <p className="text-neutral-900 font-medium">{lead.intake_channel}</p>
                </div>
                {lead.walkthrough_scheduled && (
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Walkthrough</p>
                    <p className="text-neutral-900 font-medium">
                      {lead.walkthrough_date ? new Date(lead.walkthrough_date).toLocaleString() : 'Scheduled'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Recommended Action</p>
                  <p className="text-neutral-900 font-medium">{recommendedLabel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Confidence</p>
                  <p className="text-neutral-900 font-medium">{lead.decision_confidence ? `${Math.round(lead.decision_confidence * 100)}%` : '—'}</p>
                </div>
              </div>
              {lead.notes && (
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Notes</p>
                  <p>{lead.notes}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {intake ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Issue Summary</p>
                    <p className="text-neutral-900 font-medium">{intake.issue_summary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Urgency</p>
                      <p>{intake.urgency || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Address</p>
                      <p>{intake.job_address || '—'}</p>
                    </div>
                  </div>
                  {intake.access_notes && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Access Notes</p>
                      <p>{intake.access_notes}</p>
                    </div>
                  )}
                  {intake.attachments && intake.attachments.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Attachments</p>
                      <ul className="list-disc list-inside">
                        {intake.attachments.map((attachment) => (
                          <li key={attachment} className="text-[#0f2749]">
                            <a href={attachment} target="_blank" rel="noreferrer" className="underline">
                              {attachment}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Handled By</p>
                      <p>{intake.handled_by || lead.handled_by || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Call Source</p>
                      <p>{intake.call_source || lead.call_source || '—'}</p>
                    </div>
                  </div>
                  {intake.decision_notes && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Decision Notes</p>
                      <p>{intake.decision_notes}</p>
                    </div>
                  )}
                  {history.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Intake History</p>
                      <div className="space-y-2 border border-neutral-200 divide-y divide-neutral-100">
                        {history.map((record) => (
                          <div key={record.id} className="p-2 text-xs">
                            <p className="font-semibold text-neutral-900">
                              {new Date(record.captured_at || record.created_at || '').toLocaleString()} — {record.form_snapshot?.intake_channel}
                            </p>
                            <p className="text-neutral-600">{record.form_snapshot?.issue_summary}</p>
                            <p className="text-neutral-500">
                               Recommended: {record.decision?.next_step} ({record.decision?.confidence ? Math.round(record.decision.confidence * 100) : '—'}%)
                             </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-neutral-500">No intake metadata captured.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
