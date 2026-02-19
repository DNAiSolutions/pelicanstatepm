import { useState } from 'react';
import { mockLeadIntakeRecords, LEAD_NEXT_STEP_LABELS, type Lead } from '../../data/pipeline';
import { useNavigate } from 'react-router-dom';

type LeadDetailDrawerProps = {
  lead: Lead | null;
  onClose: () => void;
  onDelete?: (leadId: string) => void;
};

export function LeadDetailDrawer({ lead, onClose, onDelete }: LeadDetailDrawerProps) {
  const [tab, setTab] = useState<'Summary' | 'Intake'>('Summary');
  const navigate = useNavigate();
  if (!lead) return null;

  const intake = lead.intakeMetadata;
  const history = mockLeadIntakeRecords
    .filter((record) => record.leadId === lead.id)
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
  const recommendedLabel = lead.recommendedNextStep ? LEAD_NEXT_STEP_LABELS[lead.recommendedNextStep] || lead.recommendedNextStep : 'Review';

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-neutral-200 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Lead Detail</p>
            <h3 className="text-xl font-heading font-semibold text-neutral-900">{lead.companyName}</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onDelete?.(lead.id)}
              className="text-xs uppercase tracking-[0.3em] text-rose-600"
            >
              Delete
            </button>
            {lead.walkthroughScheduled && (
              <button
                onClick={() => navigate(`/walkthroughs/new/${lead.id}`)}
                className="text-xs uppercase tracking-[0.3em] text-[#143352]"
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
              className={`pb-1 ${tab === label ? 'text-[#143352] border-b-2 border-[#143352]' : 'text-neutral-500'}`}
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
                <p className="text-neutral-900 font-medium">{lead.contactName} · {lead.phone}</p>
                <p>{lead.email}</p>
                {lead.preferredChannel && <p className="text-xs text-neutral-500">Prefers {lead.preferredChannel}</p>}
              </div>
              {lead.walkthroughPrepBrief && (
                <div className="border border-neutral-200 p-3 rounded">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Prep Brief</p>
                  <p className="text-sm text-neutral-900 font-semibold">{lead.projectType || 'General Construction'}</p>
                  <p className="text-xs text-neutral-600">{lead.walkthroughPrepBrief.summary}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Stage</p>
                  <p className="text-neutral-900 font-medium">{lead.stage}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Channel</p>
                  <p className="text-neutral-900 font-medium">{lead.intakeChannel}</p>
                </div>
                {lead.walkthroughScheduled && (
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Walkthrough</p>
                    <p className="text-neutral-900 font-medium">
                      {lead.walkthroughDate ? new Date(lead.walkthroughDate).toLocaleString() : 'Scheduled'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Recommended Action</p>
                  <p className="text-neutral-900 font-medium">{recommendedLabel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Confidence</p>
                  <p className="text-neutral-900 font-medium">{lead.decisionConfidence ? `${Math.round(lead.decisionConfidence * 100)}%` : '—'}</p>
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
                    <p className="text-neutral-900 font-medium">{intake.issueSummary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Urgency</p>
                      <p>{intake.urgency || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Address</p>
                      <p>{intake.jobAddress || '—'}</p>
                    </div>
                  </div>
                  {intake.accessNotes && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Access Notes</p>
                      <p>{intake.accessNotes}</p>
                    </div>
                  )}
                  {intake.attachments && intake.attachments.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Attachments</p>
                      <ul className="list-disc list-inside">
                        {intake.attachments.map((attachment) => (
                          <li key={attachment} className="text-[#143352]">
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
                      <p>{intake.handledBy || lead.handledBy || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Call Source</p>
                      <p>{intake.callSource || lead.callSource || '—'}</p>
                    </div>
                  </div>
                  {intake.decisionNotes && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Decision Notes</p>
                      <p>{intake.decisionNotes}</p>
                    </div>
                  )}
                  {history.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Intake History</p>
                      <div className="space-y-2 border border-neutral-200 divide-y divide-neutral-100">
                        {history.map((record) => (
                          <div key={record.id} className="p-2 text-xs">
                            <p className="font-semibold text-neutral-900">
                              {new Date(record.capturedAt).toLocaleString()} — {record.formSnapshot.intakeChannel}
                            </p>
                            <p className="text-neutral-600">{record.formSnapshot.issueSummary}</p>
                            <p className="text-neutral-500">
                              Recommended: {record.decision.nextStep} ({Math.round(record.decision.confidence * 100)}%)
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
