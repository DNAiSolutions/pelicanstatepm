import type { ScopeAnalysisResult } from '../../data/pipeline';
import type { TaskTemplate } from '../../services/projectTaskService';
import { projectTaskService } from '../../services/projectTaskService';

type ScopeAnalysisPanelProps = {
  analysis?: ScopeAnalysisResult;
  onAccept: (template: TaskTemplate) => void;
  onOverride: (template: TaskTemplate) => void;
  selectedTemplate?: TaskTemplate;
};

const severityColorMap: Record<string, string> = {
  Info: 'text-sky-700 bg-sky-50 border-sky-200',
  Warning: 'text-amber-700 bg-amber-50 border-amber-200',
  Critical: 'text-rose-700 bg-rose-50 border-rose-200',
};

export function ScopeAnalysisPanel({ analysis, onAccept, onOverride, selectedTemplate }: ScopeAnalysisPanelProps) {
  if (!analysis) {
    return (
      <section className="border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
        Run analysis to see job type suggestions, compliance flags, and risk notes.
      </section>
    );
  }

  const templateLibrary = projectTaskService.getTemplateLibrary();
  const primaryTemplate = templateLibrary.find((tpl) => tpl.id === analysis.primaryTemplate);

  return (
    <section className="space-y-4 border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">AI Analysis</p>
          <p className="text-xs text-neutral-500">Confidence {Math.round((analysis.primaryConfidence || 0) * 100)}%</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onAccept(analysis.primaryTemplate)}
            className="border border-[#0f2749] px-3 py-1 uppercase tracking-wide text-[#0f2749]"
          >
            Accept {primaryTemplate?.name ?? analysis.primaryTemplate}
          </button>
          <select
            value={selectedTemplate ?? analysis.primaryTemplate}
            onChange={(event) => onOverride(event.target.value as TaskTemplate)}
            className="border border-neutral-300 px-2 py-1"
          >
            {templateLibrary.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-neutral-200 p-3">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Primary Match</p>
          <p className="text-sm font-semibold text-neutral-900">{primaryTemplate?.name ?? analysis.primaryTemplate}</p>
          <p className="text-xs text-neutral-500">{primaryTemplate?.description}</p>
        </div>
        <div className="border border-neutral-200 p-3">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Secondary Options</p>
          {analysis.secondarySuggestions.length === 0 ? (
            <p className="text-xs text-neutral-500">No alternates detected.</p>
          ) : (
            <ul className="text-sm text-neutral-700">
              {analysis.secondarySuggestions.map((suggestion) => {
                const template = templateLibrary.find((tpl) => tpl.id === suggestion.template);
                return (
                  <li key={suggestion.template} className="flex items-center justify-between">
                    <span>{template?.name ?? suggestion.template}</span>
                    <span className="text-xs text-neutral-500">{Math.round(suggestion.confidence * 100)}%</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {analysis.complianceFlags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Compliance Flags</p>
          <div className="space-y-2">
            {analysis.complianceFlags.map((flag) => (
              <div key={flag.id} className={`border p-2 text-sm ${severityColorMap[flag.severity] || severityColorMap.Info}`}>
                <p className="font-medium">{flag.type}</p>
                <p>{flag.message}</p>
                <p className="text-xs text-neutral-500">Source: {flag.source}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
