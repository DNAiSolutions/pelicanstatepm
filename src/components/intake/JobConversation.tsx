import { useState } from 'react';
import type { IntakeConversationState } from '../../data/pipeline';

type JobConversationProps = {
  conversation: IntakeConversationState | null;
  onStart: (summary: string) => void;
  onAnswer: (answer: string) => void;
  onGeneratePlan: () => void;
  generatingPlan: boolean;
};

export function JobConversation({ conversation, onStart, onAnswer, onGeneratePlan, generatingPlan }: JobConversationProps) {
  const [draftSummary, setDraftSummary] = useState('');
  const [draftAnswer, setDraftAnswer] = useState('');

  if (!conversation) {
    return (
      <section className="space-y-3 border border-neutral-200 bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-neutral-900">What kind of job is this?</p>
          <p className="text-xs text-neutral-500">Describe the project in plain English. The AI will take it from there.</p>
        </div>
        <textarea
          value={draftSummary}
          onChange={(event) => setDraftSummary(event.target.value)}
          placeholder="Ex: Replace museum boiler, keep original radiators, coordinate SHPO approvals."
          className="w-full border border-neutral-300 px-3 py-2 text-sm"
          rows={4}
        />
        <button
          type="button"
          onClick={() => {
            if (!draftSummary.trim()) return;
            onStart(draftSummary.trim());
            setDraftSummary('');
          }}
          className="px-4 py-2 text-sm uppercase tracking-[0.3em] bg-[#143352] text-white disabled:opacity-60"
          disabled={!draftSummary.trim()}
        >
          Start AI Intake
        </button>
      </section>
    );
  }

  const currentPrompt = conversation.pendingQuestions[0];

  return (
    <section className="space-y-3 border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-neutral-900">AI Intake Conversation</p>
          <p className="text-xs text-neutral-500">Recommended template: {conversation.recommendedTemplate}</p>
        </div>
        {conversation.readyForPlan && (
          <button
            type="button"
            onClick={onGeneratePlan}
            className="px-3 py-1 text-xs uppercase tracking-[0.3em] border border-[#143352] text-[#143352] disabled:opacity-60"
            disabled={generatingPlan}
          >
            {generatingPlan ? 'Generating…' : 'Generate Work Plan'}
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto border border-neutral-100 p-3 bg-neutral-50 text-sm">
        {conversation.messages.map((message) => (
          <div key={message.id} className={`${message.role === 'Assistant' ? 'text-[#143352]' : 'text-neutral-800'}`}>
            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400">{message.role}</p>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      {!conversation.readyForPlan && currentPrompt && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">AI Prompt</p>
          <p className="text-sm text-neutral-800">{currentPrompt}</p>
          <div className="flex gap-2">
            <input
              value={draftAnswer}
              onChange={(event) => setDraftAnswer(event.target.value)}
              placeholder="Type your answer"
              className="flex-1 border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (!draftAnswer.trim()) return;
                onAnswer(draftAnswer.trim());
                setDraftAnswer('');
              }}
              className="px-3 py-2 text-xs uppercase tracking-[0.3em] border border-neutral-400"
              disabled={!draftAnswer.trim()}
            >
              Submit
            </button>
          </div>
        </div>
      )}
      {conversation.readyForPlan && (
        <p className="text-xs text-emerald-700">All clarifications captured. Generate the work plan whenever you’re ready.</p>
      )}
    </section>
  );
}
