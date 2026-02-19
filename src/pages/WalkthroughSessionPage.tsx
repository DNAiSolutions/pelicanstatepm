// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leadService } from '../services/leadService';
import { walkthroughSessionService } from '../services/walkthroughSessionService';
import { aiWalkthroughPlannerService } from '../services/aiWalkthroughPlannerService';
import { projectTaskService } from '../services/projectTaskService';
import { projectService } from '../services/projectService';
import type { Lead, WalkthroughPlan } from '../data/pipeline';
import toast from 'react-hot-toast';

export function WalkthroughSessionPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [plan, setPlan] = useState<WalkthroughPlan | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!leadId) return;
      const data = await leadService.getById(leadId);
      if (!data) {
        toast.error('Lead not found');
        navigate('/leads');
        return;
      }
      setLead(data);
      const session = walkthroughSessionService.ensureSession(leadId, data.walkthroughDate || new Date().toISOString());
      setSessionId(session.id);
      if (session.aiPlan) {
        setPlan(session.aiPlan);
      } else {
        const prepBrief = data.walkthroughPrepBrief || aiWalkthroughPlannerService.generatePrepBrief(data.intakeMetadata?.issueSummary || '');
        const generated = aiWalkthroughPlannerService.generateWalkthroughPlan(data.projectType || 'General Construction', prepBrief);
        walkthroughSessionService.attachPlan(session.id, generated);
        setPlan(generated);
      }
      setLoading(false);
    }
    load();
  }, [leadId, navigate]);

  const checklist = useMemo(() => plan?.checklist || [], [plan]);

  const handleResponseChange = (question: string, value: string) => {
    setResponses((prev) => ({ ...prev, [question]: value }));
  };

  const handleFinalize = async () => {
    if (!sessionId || !plan || !lead) {
      toast.error('Missing walkthrough data');
      return;
    }
    walkthroughSessionService.complete(sessionId, responses);
    const session = walkthroughSessionService.getById(sessionId);
    const finalizedPlan = session?.finalizedPlan ?? plan;
    const notes = Object.entries(responses)
      .map(([question, answer]) => `${question}: ${answer}`)
      .join('\n');

    await leadService.update(lead.id, {
      stage: 'Qualified',
      walkthroughPlan: finalizedPlan,
      walkthroughNotes: notes,
    });

    if (lead.projectId) {
      const project = await projectService.getProject(lead.projectId);
      const siteId = project?.siteId;
      finalizedPlan.steps.forEach((step) => {
        projectTaskService.createTask(lead.projectId!, {
          title: `Walkthrough · ${step.title}`,
          description: `${step.instructions}\nTrades: ${step.trades.join(', ')}\nMaterials: ${step.materials.join(', ')}`,
          status: 'Requested',
          priority: 'Medium',
          category: 'Planning',
          siteId,
        });
      });
      await projectService.updateProject(lead.projectId, {
        walkthroughPlan: finalizedPlan,
        walkthroughNotes: notes,
      });
    }

    toast.success('Walkthrough finalized and added to plan');
    navigate('/leads');
  };

  if (loading || !lead || !plan) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-[#143352]/20 border-t-[#143352] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Walkthrough Session</p>
        <h1 className="text-3xl font-heading font-bold text-neutral-900">{lead.companyName}</h1>
        <p className="text-sm text-neutral-500">Project Type: {lead.projectType || 'General Construction'}</p>
      </div>

      {lead.walkthroughPrepBrief && (
        <section className="bg-white border border-neutral-200 p-5 space-y-3">
          <h2 className="text-lg font-heading font-semibold text-neutral-900">Prep Brief</h2>
          <p className="text-sm text-neutral-600">{lead.walkthroughPrepBrief.summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Questions</p>
              <ul className="list-disc list-inside text-neutral-700">
                {lead.walkthroughPrepBrief.keyQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Supplies</p>
              <ul className="text-neutral-700">
                {lead.walkthroughPrepBrief.supplies.map((item) => (
                  <li key={item.item}>{item.item}{item.quantity ? ` · ${item.quantity}` : ''}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="bg-white border border-neutral-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold text-neutral-900">AI Walkthrough Plan</h2>
          <button
            onClick={() => {
              const prep = lead.walkthroughPrepBrief || aiWalkthroughPlannerService.generatePrepBrief(lead.intakeMetadata?.issueSummary || '');
              const updated = aiWalkthroughPlannerService.generateWalkthroughPlan(lead.projectType || 'General Construction', prep);
              setPlan(updated);
              if (sessionId) walkthroughSessionService.attachPlan(sessionId, updated);
              toast.success('Plan regenerated');
            }}
            className="text-sm text-[#143352] border border-[#143352] px-3 py-1"
          >
            Regenerate Plan
          </button>
        </div>
        <div className="space-y-4">
          {plan.steps.map((step) => (
            <div key={step.title} className="border border-neutral-200 p-4 text-sm">
              <p className="font-semibold text-neutral-900">{step.title}</p>
              <p className="text-neutral-600">{step.instructions}</p>
              <p className="text-neutral-500 mt-2">Trades: {step.trades.join(', ')}</p>
              <p className="text-neutral-500">Materials: {step.materials.join(', ')}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-neutral-200 p-5 space-y-4">
        <h2 className="text-lg font-heading font-semibold text-neutral-900">Walkthrough Responses</h2>
        {checklist.length === 0 ? (
          <p className="text-sm text-neutral-500">No checklist generated.</p>
        ) : (
          checklist.map((question) => (
            <div key={question} className="space-y-2">
              <p className="text-sm font-medium text-neutral-800">{question}</p>
              <textarea
                value={responses[question] || ''}
                onChange={(e) => handleResponseChange(question, e.target.value)}
                className="w-full border border-neutral-200 px-3 py-2 text-sm"
                rows={2}
              />
            </div>
          ))
        )}
      </section>

      <section className="bg-white border border-neutral-200 p-5 space-y-3">
        <h2 className="text-lg font-heading font-semibold text-neutral-900">Supply & Labor Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Supply List</p>
            <ul className="list-disc list-inside text-neutral-700">
              {plan.supplyList.map((item) => (
                <li key={item.item}>{item.item}{item.quantity ? ` · ${item.quantity}` : ''}{item.responsible ? ` (${item.responsible})` : ''}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Labor Stack</p>
            <ul className="text-neutral-700">
              {plan.laborStack.map((entry, index) => (
                <li key={`${entry.role}-${index}`}>{entry.role} — {entry.hours} hrs</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button onClick={() => navigate('/leads')} className="px-4 py-2 border border-neutral-300 text-neutral-600">
          Cancel
        </button>
        <button onClick={handleFinalize} className="px-4 py-2 bg-[#143352] text-white">
          Finalize Walkthrough
        </button>
      </div>
    </div>
  );
}
