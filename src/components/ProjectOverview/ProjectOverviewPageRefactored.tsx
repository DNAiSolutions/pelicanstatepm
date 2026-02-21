import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  mockProperties,
  mockContacts,
  mockLeads,
  mockSites,
  mockUsers,
  type ConsultationChecklist as ConsultationChecklistModel,
  type IntakeResearchSnippet,
  type ScopeAnalysisResult,
  type IntakeConversationState,
  type Priority,
  type TaskTemplate,
} from '../../data/pipeline';
import type { Project } from '../../types';
import { projectService } from '../../services/projectService';
import { projectTaskService, type TemplateTask, type TemplateMaterial, type TemplateLabor, type ProjectPlan } from '../../services/projectTaskService';
import { retainerRateService } from '../../services/retainerRateService';
import { consultationPrepService } from '../../services/consultationPrepService';
import { llmResearchService } from '../../services/llmResearchService';
import { aiTaskPlannerService } from '../../services/aiTaskPlannerService';
import {
  ProjectClientsPanel,
  ProjectFiltersBar,
  ProjectDetailsPanel,
  ProjectNewModal,
} from './index';

type PlanEditsState = {
  questions: string[];
  materials: string;
  labor: string;
  selectedTaskTitles: Set<string>;
};

const LABOR_RATE_DEFAULTS = {
  'Manual Labor': 45,
  'Project Management': 85,
  'Construction Supervision': 95,
} as const;

type LaborRateKey = keyof typeof LABOR_RATE_DEFAULTS;

const buildWalkthroughTasks = (plan: ProjectPlan, analysis?: ScopeAnalysisResult): TemplateTask[] => {
  const generated: TemplateTask[] = [];
  plan.questions.slice(0, 3).forEach((question) => {
    generated.push({
      title: `Walkthrough: ${question}`,
      description: 'Discuss with client and document response during walkthrough.',
      priority: 'Medium',
      status: 'Requested',
      category: 'Planning',
    } as TemplateTask);
  });
  generated.push({
    title: 'Capture existing condition photos',
    description: 'Photograph all impacted spaces, utilities, and access routes.',
    priority: 'Medium',
    status: 'Requested',
    category: 'Planning',
  } as TemplateTask);
  generated.push({
    title: 'Confirm logistics & shutdown windows',
    description: 'Validate after-hours access, safety constraints, and occupant coordination.',
    priority: 'Medium',
    status: 'Requested',
    category: 'Planning',
  } as TemplateTask);
  if (analysis?.complianceFlags?.some((flag) => flag.type === 'Historic')) {
    generated.push({
      title: 'Historic documentation review',
      description: 'Verify SHPO documentation, material submittals, and approvals needed.',
      priority: 'High',
      status: 'Requested',
      category: 'Planning',
    } as TemplateTask);
  }
  return generated;
};

export function ProjectOverviewPageRefactored() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    propertyId: mockProperties[0]?.id || '',
    locationNotes: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    totalBudget: 65000,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    leadId: '',
    contactId: '',
    clientMode: 'existing' as 'existing' | 'new',
    existingClient: '',
    propertyMode: 'existing' as 'existing' | 'new',
    newPropertyName: '',
    newPropertyFunding: '',
    newPropertyPriority: 'Medium' as Priority,
    scopeNotes: '',
    templateType: 'default' as TaskTemplate,
  });
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [autoCreateTasks, setAutoCreateTasks] = useState(true);
  const [planVersion, setPlanVersion] = useState(0);
  const [planEdits, setPlanEdits] = useState<PlanEditsState | null>(null);
  const [laborRates, setLaborRates] = useState<Record<string, number>>(LABOR_RATE_DEFAULTS);
  const [scopeAnalysis, setScopeAnalysis] = useState<ScopeAnalysisResult | undefined>();
  const [consultationChecklist, setConsultationChecklist] = useState<ConsultationChecklistModel | undefined>();
  const [llmSnippets, setLlmSnippets] = useState<IntakeResearchSnippet[]>([]);
  const [researchLoading, setResearchLoading] = useState(false);
  const [conversationState, setConversationState] = useState<IntakeConversationState | null>(null);
  const [customPlan, setCustomPlan] = useState<ProjectPlan | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [walkthroughTasks, setWalkthroughTasks] = useState<TemplateTask[]>([]);

  // Load projects
  useEffect(() => {
    async function loadProjects() {
      try {
        setIsLoading(true);
        const data = await projectService.getProjects();
        setProjects(data);
        if (data[0]) {
          setSelectedProjectId((prev) => prev || data[0].id);
          setExpandedClients(new Set([data[0].client_name]));
        }
      } catch (error) {
        toast.error('Unable to load projects');
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, []);

  // Handle lead selection
  useEffect(() => {
    if (!form.leadId) return;
    const lead = mockLeads.find((lead) => lead.id === form.leadId);
    if (lead) {
      setForm((prev) => ({
        ...prev,
        clientName: lead.contactName,
        clientEmail: lead.email,
        clientPhone: lead.phone,
        propertyId: lead.propertyId || prev.propertyId,
      }));
    }
  }, [form.leadId]);

  // Handle existing client selection
  useEffect(() => {
    if (form.clientMode === 'existing' && form.existingClient) {
      const contact = mockContacts.find((c) => c.company === form.existingClient);
      if (contact) {
        setForm((prev) => ({
          ...prev,
          clientName: contact.name,
          clientEmail: contact.email,
          clientPhone: contact.phone,
        }));
      } else {
        setForm((prev) => ({ ...prev, clientName: form.existingClient }));
      }
    }
  }, [form.clientMode, form.existingClient]);

  // Load labor rates
  useEffect(() => {
    async function loadLaborRates() {
      try {
        const rates = await retainerRateService.getRetainerRates();
        if (Array.isArray(rates)) {
          const next: Record<string, number> = { ...LABOR_RATE_DEFAULTS };
          rates.forEach((rate: any) => {
            if (rate?.rate_type && typeof rate.hourly_rate === 'number') {
              next[rate.rate_type as string] = rate.hourly_rate;
            }
          });
          setLaborRates(next);
        }
      } catch (error) {
        console.warn('Unable to load retainer rates, using defaults', error);
      }
    }
    loadLaborRates();
  }, []);

  // Compute derived state
  const templateLibrary = useMemo(() => projectTaskService.getTemplateLibrary(), []);
  const selectedTemplateMeta = useMemo(
    () => templateLibrary.find((template) => template.id === form.templateType),
    [templateLibrary, form.templateType]
  );

  const projectPlan = useMemo(() => {
    if (customPlan) return customPlan;
    if (!form.scopeNotes && !form.locationNotes && !form.templateType) return null;
    return projectTaskService.generateProjectPlan(form.templateType, `${form.scopeNotes} ${form.locationNotes}`.trim());
  }, [customPlan, form.templateType, form.scopeNotes, form.locationNotes, planVersion]);

  // Update plan edits when project plan changes
  useEffect(() => {
    if (!projectPlan) {
      setPlanEdits(null);
      return;
    }
    setPlanEdits({
      questions: projectPlan.questions,
      materials: projectPlan.materials,
      labor: projectPlan.labor,
      selectedTaskTitles: new Set(projectPlan.tasks.map((task) => task.title)),
    });
  }, [projectPlan]);

  // Filter projects
  const projectsToShow = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.client_name.toLowerCase().includes(search.toLowerCase());
      const matchesProperty = !propertyFilter || project.property_id === propertyFilter;
      return matchesSearch && matchesProperty;
    });
  }, [projects, search, propertyFilter]);

  // Group by client
  const groupedByClient = useMemo(() => {
    const map: Record<string, Project[]> = {};
    projectsToShow.forEach((project) => {
      map[project.client_name] = map[project.client_name] || [];
      map[project.client_name].push(project);
    });
    return Object.entries(map);
  }, [projectsToShow]);

  // Get selected project
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  // Get projects for selected client
  const selectedClientProjects = useMemo(() => {
    if (!selectedProject) return [] as Project[];
    return projects.filter((project) => project.client_name === selectedProject.client_name);
  }, [projects, selectedProject]);

  // Get unique client names
  const clientOptions = useMemo(() => Array.from(new Set(projects.map((project) => project.client_name))).sort(), [projects]);

  // Update selected project when projects change
  useEffect(() => {
    if (!projectsToShow.find((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(projectsToShow[0]?.id || '');
    }
    if (selectedProject) {
      setExpandedClients((prev) => {
        const next = new Set(prev);
        next.add(selectedProject.client_name);
        return next;
      });
    }
  }, [projectsToShow, selectedProjectId, selectedProject]);

  // Reset modal state when closing
  useEffect(() => {
    if (!showModal) {
      setConversationState(null);
      setCustomPlan(null);
      setScopeAnalysis(undefined);
      setConsultationChecklist(undefined);
      setLlmSnippets([]);
      setWalkthroughTasks([]);
    }
  }, [showModal]);

  // Plan handlers
  const handleRegeneratePlan = () => {
    if (customPlan) {
      setCustomPlan(null);
    }
    setPlanVersion((prev) => prev + 1);
  };

  const handleQuestionsChange = (value: string) => {
    setPlanEdits((prev) => (prev ? { ...prev, questions: value.split('\n') } : prev));
  };

  const handleSummaryChange = (key: 'materials' | 'labor', value: string) => {
    setPlanEdits((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleTaskSelection = (taskTitle: string) => {
    setPlanEdits((prev) => {
      if (!prev) return prev;
      const nextSelected = new Set(prev.selectedTaskTitles);
      if (nextSelected.has(taskTitle)) {
        nextSelected.delete(taskTitle);
      } else {
        nextSelected.add(taskTitle);
      }
      return { ...prev, selectedTaskTitles: nextSelected };
    });
  };

  // Template handlers
  const handleTemplateOverride = (template: TaskTemplate) => {
    setForm((prev) => ({ ...prev, templateType: template }));
    setScopeAnalysis((prev) => {
      if (!prev) return prev;
      const updatedAnalysis = { ...prev, primaryTemplate: template };
      setConsultationChecklist(consultationPrepService.generateChecklist(updatedAnalysis, updatedAnalysis.suggestedJurisdiction));
      return updatedAnalysis;
    });
    setConversationState((prev) => (prev ? { ...prev, recommendedTemplate: template } : prev));
  };

  const handleChecklistChange = (nextChecklist: ConsultationChecklistModel) => {
    setConsultationChecklist(nextChecklist);
  };

  // AI conversation handlers
  const handleStartConversation = async (summary: string) => {
    try {
      setCustomPlan(null);
      setConversationState(null);
      setForm((prev) => ({ ...prev, scopeNotes: summary }));
      const { conversation, analysis } = aiTaskPlannerService.beginConversation(summary);
      setConversationState(conversation);
      setScopeAnalysis(analysis);
      setForm((prev) => ({ ...prev, templateType: analysis.primaryTemplate }));
      const checklist = consultationPrepService.generateChecklist(analysis, analysis.suggestedJurisdiction);
      setConsultationChecklist(checklist);
      setResearchLoading(true);
      setLlmSnippets([]);
      const llmResults = await llmResearchService.getResearchSnippets({
        scope: summary,
        jobType: analysis.primaryTemplate,
        jurisdiction: analysis.suggestedJurisdiction || 'Louisiana',
      });
      setLlmSnippets(llmResults);
    } catch (error) {
      console.warn('AI intake start failed', error);
      toast.error('Unable to start AI intake. Try again.');
    } finally {
      setResearchLoading(false);
    }
  };

  const handleConversationAnswer = (answer: string) => {
    if (!conversationState) return;
    const updated = aiTaskPlannerService.recordAnswer(conversationState, answer);
    setConversationState(updated);
  };

  const handleGeneratePlanFromConversation = () => {
    if (!conversationState) return;
    try {
      setGeneratingPlan(true);
      const { plan } = aiTaskPlannerService.buildPlan(conversationState);
      setCustomPlan(plan);
      setWalkthroughTasks(buildWalkthroughTasks(plan, scopeAnalysis));
      toast.success('AI work plan generated');
    } catch (error) {
      console.warn('Unable to generate plan', error);
      toast.error('Unable to build work plan.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Labor and materials helpers
  const mapRoleToRateKey = (role: string): LaborRateKey => {
    const normalized = role.toLowerCase();
    if (normalized.includes('project')) return 'Project Management';
    if (normalized.includes('manual')) return 'Manual Labor';
    return 'Construction Supervision';
  };

  const buildLaborForTask = (task: TemplateTask): TemplateLabor[] => {
    const baseEntries = task.labor && task.labor.length > 0
      ? task.labor
      : [
          { role: 'Project Management', hours: 6 },
          { role: 'Manual Labor', hours: 12 },
        ];
    return baseEntries.map((entry) => {
      const rateKey = mapRoleToRateKey(entry.role);
      return {
        ...entry,
        rate: entry.rate ?? laborRates[rateKey] ?? LABOR_RATE_DEFAULTS[rateKey],
      };
    });
  };

  const buildMaterialsForTask = (task: TemplateTask, perTaskBudget: number): TemplateMaterial[] => {
    if (task.materials && task.materials.length > 0) {
      return task.materials;
    }
    const allowance = Math.max(750, Math.round(perTaskBudget * 0.35));
    return [
      {
        name: `${task.title} materials`,
        quantity: 1,
        unit: 'lot',
        unitCost: allowance,
      },
    ];
  };

  // Create project handler
  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      let propertyId = form.propertyId;
      if (form.propertyMode === 'new') {
        if (!form.newPropertyName.trim()) {
          toast.error('Enter a property name');
          return;
        }
        const newPropertyId = `property-${form.newPropertyName.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
        mockProperties.push({
          id: newPropertyId,
          name: form.newPropertyName.trim(),
          fundingSource: form.newPropertyFunding.trim() || 'Client Provided',
          priority: form.newPropertyPriority,
        });
        propertyId = newPropertyId;
      }
      let siteId = mockSites.find((site) => site.propertyId === propertyId)?.id;
      if (!siteId) {
        const newSiteId = `site-${Date.now().toString(36)}`;
        mockSites.push({
          id: newSiteId,
          propertyId,
          name: form.locationNotes || `${form.name} Site`,
          address: form.locationNotes || 'Address TBD',
          isHistoric: false,
        });
        siteId = newSiteId;
      }
      const finalClientName = form.clientMode === 'existing' ? (form.existingClient || form.clientName) : form.clientName;
      const finalClientEmail = form.clientMode === 'existing' && form.existingClient && !form.clientEmail
        ? mockContacts.find((c) => c.company === form.existingClient)?.email || form.clientEmail
        : form.clientEmail;
      const finalClientPhone = form.clientMode === 'existing' && form.existingClient && !form.clientPhone
        ? mockContacts.find((c) => c.company === form.existingClient)?.phone || form.clientPhone
        : form.clientPhone;
      const plan = projectPlan;
      const editedQuestions = planEdits?.questions?.map((question) => question.trim()).filter((question) => question.length > 0);
      const planQuestions = editedQuestions && editedQuestions.length > 0 ? editedQuestions : plan?.questions || [];
      const planMaterials = planEdits?.materials ?? plan?.materials ?? '';
      const planLabor = planEdits?.labor ?? plan?.labor ?? '';
      const summary = plan ? `${plan.templateName}: ${plan.description}` : (form.scopeNotes || form.locationNotes || 'New client request');
      const tasksToCreate = plan
        ? (planEdits ? plan.tasks.filter((task) => planEdits.selectedTaskTitles.has(task.title)) : plan.tasks)
        : [];
      const walkthroughPrepTasks = walkthroughTasks.length > 0 ? walkthroughTasks : [];
      const payload = {
        name: form.name,
        propertyId,
        siteId,
        clientName: finalClientName || mockLeads.find((l) => l.id === form.leadId)?.companyName || '',
        clientEmail: finalClientEmail,
        clientPhone: finalClientPhone,
        internalOwnerId: mockUsers[0]?.id || 'user-1',
        primeVendorId: 'vendor-1',
        status: 'Planning' as Project['status'],
        clientVisibility: { showBudget: true, showTimeline: true, showInvoices: true, showContacts: true },
        startDate: form.startDate,
        endDate: form.endDate,
        totalBudget: form.totalBudget,
        spentBudget: 0,
        clientSummary: summary,
        internalNotes: plan ? `AI Plan: ${plan.costHeuristic}` : 'Created from portfolio dashboard',
      };

      const project = await projectService.createProject(payload);
      if (form.leadId) await projectService.linkLead(project.id, form.leadId);
      if (form.contactId) await projectService.linkContact(project.id, form.contactId);
      if (autoCreateTasks && plan) {
        const combinedTasks = [...walkthroughPrepTasks, ...tasksToCreate];
        const tasksCount = Math.max(combinedTasks.length || (plan?.tasks.length ?? 1), 1);
        const budgetPerTask = form.totalBudget / tasksCount;
        combinedTasks.forEach((taskConfig) => {
          projectTaskService.createTask(project.id, {
            title: taskConfig.title,
            description: taskConfig.description,
            status: taskConfig.status || 'Requested',
            priority: taskConfig.priority,
            category: taskConfig.category || 'Planning',
            siteId,
            materials: buildMaterialsForTask(taskConfig, budgetPerTask),
            labor: buildLaborForTask(taskConfig),
            aiQuestions: planQuestions,
            aiMaterialSummary: planMaterials,
            aiLaborSummary: planLabor,
          });
        });
      }
      setProjects((prev) => [...prev, project]);
      setSelectedProjectId(project.id);
      setShowModal(false);
      setForm({
        name: '',
        propertyId: mockProperties[0]?.id || '',
        locationNotes: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        totalBudget: 65000,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        leadId: '',
        contactId: '',
        clientMode: 'existing',
        existingClient: '',
        propertyMode: 'existing',
        newPropertyName: '',
        newPropertyFunding: '',
        newPropertyPriority: 'Medium',
        scopeNotes: '',
        templateType: 'default',
      });
      setWalkthroughTasks([]);
      setAutoCreateTasks(true);
      toast.success('Project created');
    } catch (error) {
      toast.error('Unable to create project');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f2749]" />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <ProjectClientsPanel
        groupedByClient={groupedByClient}
        expandedClients={expandedClients}
        onExpandedClientsChange={setExpandedClients}
        selectedProjectId={selectedProjectId}
        onProjectSelect={setSelectedProjectId}
        onNewProjectClick={() => setShowModal(true)}
      />

      <div className="flex-1 space-y-6">
        <ProjectFiltersBar
          search={search}
          onSearchChange={setSearch}
          propertyFilter={propertyFilter}
          onPropertyFilterChange={setPropertyFilter}
          onNewProjectClick={() => setShowModal(true)}
        />

        <ProjectDetailsPanel
          selectedProject={selectedProject}
          selectedClientProjects={selectedClientProjects}
          onProjectClick={setSelectedProjectId}
          onNavigate={(path) => navigate(path)}
        />
      </div>

      <ProjectNewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateProject}
        form={form}
        onFormChange={(updates) => setForm((prev) => ({ ...prev, ...updates }))}
        clientOptions={clientOptions}
        selectedTemplateMeta={selectedTemplateMeta}
        projectPlan={projectPlan}
        planEdits={planEdits}
        conversationState={conversationState}
        scopeAnalysis={scopeAnalysis}
        consultationChecklist={consultationChecklist}
        llmSnippets={llmSnippets}
        autoCreateTasks={autoCreateTasks}
        onAutoCreateTasksChange={setAutoCreateTasks}
        walkthroughTasks={walkthroughTasks}
        researchLoading={researchLoading}
        generatingPlan={generatingPlan}
        onStartConversation={handleStartConversation}
        onConversationAnswer={handleConversationAnswer}
        onGeneratePlanFromConversation={handleGeneratePlanFromConversation}
        onTemplateOverride={handleTemplateOverride}
        onChecklistChange={handleChecklistChange}
        onRegeneratePlan={handleRegeneratePlan}
        onQuestionsChange={handleQuestionsChange}
        onSummaryChange={handleSummaryChange}
        onToggleTaskSelection={toggleTaskSelection}
      />
    </div>
  );
}
