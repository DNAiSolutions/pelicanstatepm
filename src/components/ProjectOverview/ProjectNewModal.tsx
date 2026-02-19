import { X, RefreshCcw } from 'lucide-react';
import type {
  ConsultationChecklist as ConsultationChecklistModel,
  IntakeResearchSnippet,
  ScopeAnalysisResult,
  IntakeConversationState,
  Priority,
  TaskTemplate,
} from '../../data/pipeline';
import type { ProjectPlan, TemplateTask } from '../../services/projectTaskService';
import { mockCampuses, mockLeads, mockContacts } from '../../data/pipeline';
import { JobConversation } from '../intake/JobConversation';
import { ScopeAnalysisPanel } from '../intake/ScopeAnalysisPanel';
import { ConsultationChecklist } from '../intake/ConsultationChecklist';
import { ResearchSnippets } from '../intake/ResearchSnippets';

type ProjectFormType = {
  name: string;
  campusId: string;
  locationNotes: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  totalBudget: number;
  startDate: string;
  endDate: string;
  leadId: string;
  contactId: string;
  clientMode: 'existing' | 'new';
  existingClient: string;
  campusMode: 'existing' | 'new';
  newCampusName: string;
  newCampusFunding: string;
  newCampusPriority: Priority;
  scopeNotes: string;
  templateType: TaskTemplate;
};

interface ProjectNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  form: ProjectFormType;
  onFormChange: (updates: Partial<ProjectFormType>) => void;
  clientOptions: string[];
  selectedTemplateMeta: any;
  projectPlan: ProjectPlan | null;
  planEdits: any;
  conversationState: IntakeConversationState | null;
  scopeAnalysis: ScopeAnalysisResult | undefined;
  consultationChecklist: ConsultationChecklistModel | undefined;
  llmSnippets: IntakeResearchSnippet[];
  autoCreateTasks: boolean;
  onAutoCreateTasksChange: (value: boolean) => void;
  walkthroughTasks: any[];
  researchLoading: boolean;
  generatingPlan: boolean;
  onStartConversation: (summary: string) => Promise<void>;
  onConversationAnswer: (answer: string) => void;
  onGeneratePlanFromConversation: () => void;
  onTemplateOverride: (template: TaskTemplate) => void;
  onChecklistChange: (checklist: ConsultationChecklistModel) => void;
  onRegeneratePlan: () => void;
  onQuestionsChange: (value: string) => void;
  onSummaryChange: (key: 'materials' | 'labor', value: string) => void;
  onToggleTaskSelection: (taskTitle: string) => void;
}

export function ProjectNewModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  onFormChange,
  clientOptions,
  selectedTemplateMeta,
  projectPlan,
  planEdits,
  conversationState,
  scopeAnalysis,
  consultationChecklist,
  llmSnippets,
  autoCreateTasks,
  onAutoCreateTasksChange,
  walkthroughTasks,
  researchLoading,
  generatingPlan,
  onStartConversation,
  onConversationAnswer,
  onGeneratePlanFromConversation,
  onTemplateOverride,
  onChecklistChange,
  onRegeneratePlan,
  onQuestionsChange,
  onSummaryChange,
  onToggleTaskSelection,
}: ProjectNewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl border border-neutral-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-neutral-900">New Project</h2>
          <button onClick={onClose} className="text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Mode Selection */}
          <div className="md:col-span-2 flex items-center gap-4 text-sm text-neutral-600">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="clientMode"
                value="existing"
                checked={form.clientMode === 'existing'}
                onChange={(e) => onFormChange({ clientMode: e.target.value as 'existing' | 'new' })}
              />
              Existing Client
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="clientMode"
                value="new"
                checked={form.clientMode === 'new'}
                onChange={(e) => onFormChange({ clientMode: e.target.value as 'existing' | 'new' })}
              />
              New Client
            </label>
          </div>

          {/* Client Selection */}
          {form.clientMode === 'existing' ? (
            <select
              value={form.existingClient}
              onChange={(e) => onFormChange({ existingClient: e.target.value })}
              className="border border-neutral-300 px-3 py-2 md:col-span-2"
            >
              <option value="">Select client...</option>
              {clientOptions.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                value={form.clientName}
                onChange={(e) => onFormChange({ clientName: e.target.value })}
                placeholder="Client Contact"
                className="border border-neutral-300 px-3 py-2"
              />
              <input
                value={form.clientEmail}
                onChange={(e) => onFormChange({ clientEmail: e.target.value })}
                placeholder="Client Email"
                className="border border-neutral-300 px-3 py-2"
              />
              <input
                value={form.clientPhone}
                onChange={(e) => onFormChange({ clientPhone: e.target.value })}
                placeholder="Client Phone"
                className="border border-neutral-300 px-3 py-2"
              />
            </>
          )}

          {/* Project Name */}
          <input
            value={form.name}
            onChange={(e) => onFormChange({ name: e.target.value })}
            required
            placeholder="Project Name"
            className="border border-neutral-300 px-3 py-2"
          />

          {/* Campus Mode Selection */}
          <div className="md:col-span-2 flex items-center gap-4 text-sm text-neutral-600">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="campusMode"
                value="existing"
                checked={form.campusMode === 'existing'}
                onChange={(e) => onFormChange({ campusMode: e.target.value as 'existing' | 'new' })}
              />
              Existing Campus
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="campusMode"
                value="new"
                checked={form.campusMode === 'new'}
                onChange={(e) => onFormChange({ campusMode: e.target.value as 'existing' | 'new' })}
              />
              Add New Campus
            </label>
          </div>

          {/* Campus Selection */}
          {form.campusMode === 'existing' ? (
            <select
              value={form.campusId}
              onChange={(e) => onFormChange({ campusId: e.target.value })}
              className="border border-neutral-300 px-3 py-2"
            >
              {mockCampuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={form.newCampusName}
                onChange={(e) => onFormChange({ newCampusName: e.target.value })}
                placeholder="Campus Name"
                className="border border-neutral-300 px-3 py-2"
              />
              <input
                value={form.newCampusFunding}
                onChange={(e) => onFormChange({ newCampusFunding: e.target.value })}
                placeholder="Funding Source"
                className="border border-neutral-300 px-3 py-2"
              />
              <select
                value={form.newCampusPriority}
                onChange={(e) => onFormChange({ newCampusPriority: e.target.value as Priority })}
                className="border border-neutral-300 px-3 py-2"
              >
                {(['Critical', 'High', 'Medium', 'Low'] as Priority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location Notes */}
          <textarea
            value={form.locationNotes}
            onChange={(e) => onFormChange({ locationNotes: e.target.value })}
            placeholder="Location / notes"
            className="border border-neutral-300 px-3 py-2 md:col-span-2"
            rows={2}
          />

          {/* AI Intake Section */}
          <div className="md:col-span-2 space-y-4">
            <JobConversation
              conversation={conversationState}
              onStart={onStartConversation}
              onAnswer={onConversationAnswer}
              onGeneratePlan={onGeneratePlanFromConversation}
              generatingPlan={generatingPlan}
            />
            <ScopeAnalysisPanel
              analysis={scopeAnalysis}
              onAccept={(template) => onTemplateOverride(template)}
              onOverride={(template) => onTemplateOverride(template)}
              selectedTemplate={form.templateType}
            />
            <ConsultationChecklist
              checklist={consultationChecklist}
              onChecklistChange={onChecklistChange}
            />
            {walkthroughTasks.length > 0 && (
              <div className="bg-white border border-neutral-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900">Walkthrough Prep Tasks</p>
                  <span className="text-xs text-neutral-500">{walkthroughTasks.length} tasks</span>
                </div>
                <ul className="space-y-2 text-sm text-neutral-700">
                  {walkthroughTasks.map((task) => (
                    <li key={task.title} className="border border-neutral-100 p-2">
                      <p className="font-medium text-neutral-900">{task.title}</p>
                      <p className="text-neutral-600">{task.description}</p>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-neutral-500">
                  These tasks will be added ahead of the AI plan to cover onsite walkthrough prep.
                </p>
              </div>
            )}
            <ResearchSnippets snippets={[...consultationChecklist?.research ?? [], ...llmSnippets]} loading={researchLoading} />
          </div>

          {/* Auto-create Tasks */}
          <div className="md:col-span-2 flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={autoCreateTasks}
              onChange={(e) => onAutoCreateTasksChange(e.target.checked)}
            />
            Auto-create tasks from AI plan
          </div>

          {/* Template Meta Info */}
          {selectedTemplateMeta && (
            <div className="md:col-span-2 bg-neutral-50 border border-dashed border-neutral-200 p-3 text-xs text-neutral-600 space-y-1">
              <p className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                {selectedTemplateMeta.name}
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#143352] bg-white border border-[#143352]/20 px-2 py-0.5">
                  {selectedTemplateMeta.category}
                </span>
              </p>
              <p>{selectedTemplateMeta.description}</p>
              <p className="text-[11px] text-neutral-500">
                Cost guidance: {selectedTemplateMeta.costHeuristic}
              </p>
            </div>
          )}

          {/* Project Plan Editor */}
          {projectPlan && planEdits && (
            <div className="md:col-span-2 bg-neutral-50 border border-neutral-200 p-4 space-y-4 text-sm text-neutral-700">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-neutral-900 flex items-center gap-2">
                    {projectPlan.templateName}
                  </p>
                  <p className="text-xs text-neutral-500">{projectPlan.description}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{projectPlan.costHeuristic}</p>
                </div>
                <button
                  type="button"
                  onClick={onRegeneratePlan}
                  className="inline-flex items-center gap-2 text-xs text-[#143352] border border-[#143352] px-3 py-1 uppercase tracking-wide"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Regenerate Plan
                </button>
              </div>
              <div className="space-y-3">
                <label className="text-xs text-neutral-500 uppercase tracking-[0.2em] block">
                  Field Questions (one per line)
                  <textarea
                    value={planEdits.questions.join('\n')}
                    onChange={(e) => onQuestionsChange(e.target.value)}
                    className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                    rows={4}
                  />
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-xs text-neutral-500 uppercase tracking-[0.2em] block">
                    Materials Guidance
                    <textarea
                      value={planEdits.materials}
                      onChange={(e) => onSummaryChange('materials', e.target.value)}
                      className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                      rows={3}
                    />
                  </label>
                  <label className="text-xs text-neutral-500 uppercase tracking-[0.2em] block">
                    Labor Guidance
                    <textarea
                      value={planEdits.labor}
                      onChange={(e) => onSummaryChange('labor', e.target.value)}
                      className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                      rows={3}
                    />
                  </label>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-neutral-900">Recommended Tasks</p>
                  <p className="text-xs text-neutral-500">
                    {planEdits.selectedTaskTitles.size} selected
                  </p>
                </div>
                <div className="mt-3 space-y-2">
                  {projectPlan.tasks.map((task: TemplateTask) => {
                    const isChecked = planEdits.selectedTaskTitles.has(task.title);
                    return (
                      <label
                        key={task.title}
                        className={`flex items-start gap-3 border border-neutral-200 p-3 ${
                          !isChecked ? 'opacity-60' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={isChecked}
                          onChange={() => onToggleTaskSelection(task.title)}
                        />
                        <div>
                          <p className="font-semibold text-neutral-900 flex items-center gap-2">
                            {task.title}
                            {task.category && (
                              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 border border-neutral-200 px-1.5 py-0.5">
                                {task.category}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-neutral-500">{task.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {!autoCreateTasks && (
                  <p className="text-xs text-amber-600 mt-2">
                    Tasks are staged but will only be created if you enable auto-create.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Budget and Dates */}
          <input
            type="number"
            value={form.totalBudget}
            onChange={(e) => onFormChange({ totalBudget: Number(e.target.value) })}
            placeholder="Budget"
            className="border border-neutral-300 px-3 py-2"
          />
          <select
            value={form.leadId}
            onChange={(e) => onFormChange({ leadId: e.target.value })}
            className="border border-neutral-300 px-3 py-2"
          >
            <option value="">Attach Lead (optional)</option>
            {mockLeads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.companyName}
              </option>
            ))}
          </select>
          <select
            value={form.contactId}
            onChange={(e) => onFormChange({ contactId: e.target.value })}
            className="border border-neutral-300 px-3 py-2"
          >
            <option value="">Attach Contact (optional)</option>
            {mockContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => onFormChange({ startDate: e.target.value })}
            className="border border-neutral-300 px-3 py-2"
          />
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => onFormChange({ endDate: e.target.value })}
            className="border border-neutral-300 px-3 py-2"
          />

          {/* Form Actions */}
          <div className="md:col-span-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 text-neutral-600"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#143352] text-white">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
