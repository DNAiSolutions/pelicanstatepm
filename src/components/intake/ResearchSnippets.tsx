import type { IntakeResearchSnippet } from '../../data/pipeline';

type ResearchSnippetsProps = {
  snippets: IntakeResearchSnippet[];
  loading?: boolean;
};

const sourceColorMap: Record<IntakeResearchSnippet['source'], string> = {
  KnowledgeBase: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LLM: 'bg-sky-50 text-sky-700 border-sky-200',
};

export function ResearchSnippets({ snippets, loading }: ResearchSnippetsProps) {
  return (
    <section className="space-y-3 border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Louisiana Requirements</p>
          <p className="text-xs text-neutral-500">Permits, codes, and local contacts.</p>
        </div>
        {loading && <p className="text-xs text-neutral-400">Researching…</p>}
      </div>
      {snippets.length === 0 ? (
        <p className="text-sm text-neutral-500">No jurisdiction-specific requirements detected. Add more scope detail to refine.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {snippets.map((snippet) => (
            <article key={snippet.id} className="space-y-2 border border-neutral-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">{snippet.category}</span>
                <span className={`border px-2 py-0.5 text-[10px] uppercase ${sourceColorMap[snippet.source]}`}>
                  {snippet.source === 'KnowledgeBase' ? 'LA KB' : 'LLM'}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-neutral-900">{snippet.title}</h4>
              <p className="text-sm text-neutral-700">{snippet.content}</p>
              {snippet.jurisdiction && <p className="text-xs text-neutral-500">Jurisdiction: {snippet.jurisdiction}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
