import { useMemo } from 'react';
import { projectTaskService, type TaskTemplate } from '../../services/projectTaskService';

type ScopeInputProps = {
  scopeText: string;
  onScopeChange: (value: string) => void;
  selectedTemplate?: TaskTemplate;
  onTemplateChange: (template: TaskTemplate) => void;
  onAnalyze: () => void;
  analyzing: boolean;
};

export function ScopeInput({ scopeText, onScopeChange, selectedTemplate, onTemplateChange, onAnalyze, analyzing }: ScopeInputProps) {
  const templates = useMemo(() => projectTaskService.getTemplateLibrary(), []);

  return (
    <section className="space-y-3 border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Describe the job</p>
          <p className="text-xs text-neutral-500">Plain-English description helps the AI pick the right workflow.</p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={analyzing}
          className="px-4 py-2 text-sm uppercase tracking-wide border border-[#17324a] text-[#17324a] disabled:opacity-60"
        >
          {analyzing ? 'Analyzing…' : 'Analyze Scope'}
        </button>
      </div>
      <textarea
        value={scopeText}
        onChange={(event) => onScopeChange(event.target.value)}
        placeholder="Ex: Replace the boiler in a 1920s building, keep original radiators, coordinate with SHPO."
        className="w-full border border-neutral-300 px-3 py-2 text-sm text-neutral-800"
        rows={4}
      />
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Optional: Override category</span>
          <select
            value={selectedTemplate ?? 'default'}
            onChange={(event) => onTemplateChange(event.target.value as TaskTemplate)}
            className="border border-neutral-300 px-3 py-2"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <div className="text-xs text-neutral-500">
          <p className="uppercase tracking-[0.3em]">Tips</p>
          <p>Include building age, property, critical systems, constraints, and anything historic or hazardous.</p>
        </div>
      </div>
    </section>
  );
}
