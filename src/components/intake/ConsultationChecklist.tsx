import { useMemo, useState } from 'react';
import type { ConsultationChecklist, IntakeChecklistItem } from '../../data/pipeline';
import { consultationPrepService } from '../../services/consultationPrepService';

type ChecklistSectionKey = 'questions' | 'measurements' | 'photos' | 'tools';

type ConsultationChecklistProps = {
  checklist?: ConsultationChecklist;
  onChecklistChange: (checklist: ConsultationChecklist) => void;
};

const SECTION_CONFIG: Record<ChecklistSectionKey, { label: string; placeholder: string }> = {
  questions: { label: 'Questions to ask', placeholder: 'Add custom question' },
  measurements: { label: 'Measurements to capture', placeholder: 'Add custom measurement' },
  photos: { label: 'Photos to capture', placeholder: 'Add custom photo request' },
  tools: { label: 'Tools to bring', placeholder: 'Add tool or resource' },
};

export function ConsultationChecklist({ checklist, onChecklistChange }: ConsultationChecklistProps) {
  const [draftText, setDraftText] = useState<Record<ChecklistSectionKey, string>>({
    questions: '',
    measurements: '',
    photos: '',
    tools: '',
  });

  const sections = useMemo(() => {
    if (!checklist) return null;
    return {
      questions: checklist.questions,
      measurements: checklist.measurements,
      photos: checklist.photos,
      tools: checklist.tools,
    } satisfies Record<ChecklistSectionKey, IntakeChecklistItem[]>;
  }, [checklist]);

  if (!checklist || !sections) {
    return (
      <section className="border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
        Run analysis to generate the consultation prep checklist.
      </section>
    );
  }

  const handleToggle = (key: ChecklistSectionKey, itemId: string) => {
    const updatedList = consultationPrepService.toggleItem(sections[key], itemId);
    onChecklistChange({
      ...checklist,
      [key]: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRemove = (key: ChecklistSectionKey, itemId: string) => {
    const updatedList = consultationPrepService.removeItem(sections[key], itemId);
    onChecklistChange({
      ...checklist,
      [key]: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAdd = (key: ChecklistSectionKey) => {
    const text = draftText[key];
    if (!text.trim()) return;
    const updatedList = consultationPrepService.addCustomItem(sections[key], text.trim());
    setDraftText((prev) => ({ ...prev, [key]: '' }));
    onChecklistChange({
      ...checklist,
      [key]: updatedList,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <section className="space-y-4 border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Consultation Prep</p>
          <p className="text-xs text-neutral-500">Editable checklist for discovery walkthrough.</p>
        </div>
        <button type="button" className="text-xs uppercase tracking-[0.3em] border border-neutral-400 px-3 py-1 text-neutral-600">
          Download PDF
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(SECTION_CONFIG) as ChecklistSectionKey[]).map((key) => (
          <div key={key} className="border border-neutral-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{SECTION_CONFIG[key].label}</p>
              <span className="text-[11px] text-neutral-400">{sections[key].length} items</span>
            </div>
            <div className="mt-3 space-y-2">
              {sections[key].length === 0 && <p className="text-xs text-neutral-400">No items yet.</p>}
              {sections[key].map((item) => (
                <label key={item.id} className="flex gap-3 border border-neutral-200 p-2 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggle(key, item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{item.text}</span>
                      {!item.required && (
                        <button type="button" className="text-[10px] uppercase text-rose-600" onClick={() => handleRemove(key, item.id)}>
                          Remove
                        </button>
                      )}
                    </div>
                    {item.reason && <p className="text-xs text-neutral-500">{item.reason}</p>}
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={draftText[key]}
                onChange={(event) => setDraftText((prev) => ({ ...prev, [key]: event.target.value }))}
                placeholder={SECTION_CONFIG[key].placeholder}
                className="flex-1 border border-neutral-300 px-2 py-1 text-sm"
              />
              <button type="button" className="border border-neutral-400 px-3 text-xs uppercase tracking-[0.3em]" onClick={() => handleAdd(key)}>
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {checklist.safetyNotes.length > 0 && (
        <div className="border border-neutral-200 p-3">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Safety Notes</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {checklist.safetyNotes.map((note) => (
              <div key={note.id} className="border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
                <p className="font-semibold">{note.severity}</p>
                <p>{note.text}</p>
                {note.source && <p className="text-xs text-amber-700">Source: {note.source}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
