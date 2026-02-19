import { useEffect, useMemo, useState } from 'react';
import {
  mockContacts,
  mockLeads,
  mockSites,
  mockUsers,
  type Project,
  type ConsultationChecklist as ConsultationChecklistModel,
  type IntakeResearchSnippet,
  type ScopeAnalysisResult,
  type IntakeConversationState,
  type Priority,
} from '../data/pipeline';
import { projectService } from '../services/projectService';
import { useProfileData } from '../hooks/useProfileData';
import { projectTaskService, type TaskTemplate, type TemplateTask, type TemplateMaterial, type TemplateLabor, type ProjectPlan } from '../services/projectTaskService';
import { retainerRateService } from '../services/retainerRateService';
import { consultationPrepService } from '../services/consultationPrepService';
import { llmResearchService } from '../services/llmResearchService';
import { aiTaskPlannerService } from '../services/aiTaskPlannerService';
import { JobConversation } from '../components/intake/JobConversation';
import { ScopeAnalysisPanel } from '../components/intake/ScopeAnalysisPanel';
import { ConsultationChecklist } from '../components/intake/ConsultationChecklist';
import { ResearchSnippets } from '../components/intake/ResearchSnippets';
import {
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  Filter,
  Loader2,
  ArrowRight,
  ChevronDown,
  RefreshCcw,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

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

const buildWalkthroughTasks = (
  plan: ProjectPlan,
  analysis?: ScopeAnalysisResult
): TemplateTask[] => {
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

export function ProjectOverviewPage() {
  const navigate = useNavigate();
  const { isAdminProfile, campuses } = useProfileData();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [campusFilter, setCampusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
const [form, setForm] = useState({
    name: '',
    campusId: campuses[0]?.id || '',
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
    campusMode: 'existing' as 'existing' | 'new',
    newCampusName: '',
    newCampusFunding: '',
    newCampusPriority: 'Medium' as Priority,
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

  useEffect(() => {
    async function loadProjects() {
      try {
        setIsLoading(true);
        // Admin profile: always empty, no mock data
        if (isAdminProfile) {
          setProjects([]);
          return;
        }
        const data = await projectService.getProjects();
        setProjects(data);
        if (data[0]) {
          setSelectedProjectId((prev) => prev || data[0].id);
          setExpandedClients(new Set([data[0].clientName]));
        }
      } catch (error) {
        toast.error('Unable to load projects');
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, [isAdminProfile]);

  useEffect(() => {
    if (!form.leadId) return;
    const lead = mockLeads.find((lead) => lead.id === form.leadId);
    if (lead) {
      setForm((prev) => ({
        ...prev,
        clientName: lead.contactName,
        clientEmail: lead.email,
        clientPhone: lead.phone,
        campusId: lead.campusId || prev.campusId,
      }));
    }
  }, [form.leadId]);

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

  const templateLibrary = useMemo(() => projectTaskService.getTemplateLibrary(), []);
  const selectedTemplateMeta = useMemo(
    () => templateLibrary.find((template) => template.id === form.templateType),
    [templateLibrary, form.templateType]
  );
  const combinedResearchSnippets = useMemo(
    () => [...(consultationChecklist?.research ?? []), ...llmSnippets],
    [consultationChecklist, llmSnippets]
  );

  const projectPlan = useMemo(() => {
    if (customPlan) return customPlan;
    if (!form.scopeNotes && !form.locationNotes && !form.templateType) return null;
    return projectTaskService.generateProjectPlan(form.templateType, `${form.scopeNotes} ${form.locationNotes}`.trim());
  }, [customPlan, form.templateType, form.scopeNotes, form.locationNotes, planVersion]);

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

  const projectsToShow = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesCampus = !campusFilter || project.campusId === campusFilter;
      return matchesSearch && matchesCampus;
    });
  }, [projects, search, campusFilter]);

  const groupedByClient = useMemo(() => {
    const map: Record<string, Project[]> = {};
    projectsToShow.forEach((project) => {
      map[project.clientName] = map[project.clientName] || [];
      map[project.clientName].push(project);
    });
    return Object.entries(map);
  }, [projectsToShow]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const selectedClientProjects = useMemo(() => {
    if (!selectedProject) return [] as Project[];
    return projects.filter((project) => project.clientName === selectedProject.clientName);
  }, [projects, selectedProject]);

  const clientOptions = useMemo(() => Array.from(new Set(projects.map((project) => project.clientName))).sort(), [projects]);

  useEffect(() => {
    if (!projectsToShow.find((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(projectsToShow[0]?.id || '');
    }
    if (selectedProject) {
      setExpandedClients((prev) => {
        const next = new Set(prev);
        next.add(selectedProject.clientName);
        return next;
      });
    }
  }, [projectsToShow, selectedProjectId, selectedProject]);

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

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      let campusId = form.campusId;
      if (form.campusMode === 'new') {
        if (!form.newCampusName.trim()) {
          toast.error('Enter a campus name');
          return;
        }
        const newCampusId = `campus-${form.newCampusName.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
        campuses.push({
          id: newCampusId,
          name: form.newCampusName.trim(),
          fundingSource: form.newCampusFunding.trim() || 'Client Provided',
          priority: form.newCampusPriority,
        });
        campusId = newCampusId;
      }
      let siteId = mockSites.find((site) => site.campusId === campusId)?.id;
      if (!siteId) {
        const newSiteId = `site-${Date.now().toString(36)}`;
        mockSites.push({
          id: newSiteId,
          campusId,
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
        campusId,
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
        campusId: campuses[0]?.id || '',
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
        campusMode: 'existing',
        newCampusName: '',
        newCampusFunding: '',
        newCampusPriority: 'Medium',
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
        <Loader2 className="w-8 h-8 animate-spin text-[#143352]" />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <aside className="w-64 bg-white border border-neutral-200 p-4 space-y-4 hidden lg:block">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Clients</p>
          <button onClick={() => setShowModal(true)} className="text-sm text-[#143352] flex items-center gap-1">
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
        <div className="space-y-3">
          {groupedByClient.map(([clientName, clientProjects]) => {
            const isExpanded = expandedClients.has(clientName);
            return (
              <div key={clientName} className="border border-neutral-200">
                <button
                  onClick={() =>
                    setExpandedClients((prev) => {
                      const next = new Set(prev);
                      if (next.has(clientName)) {
                        next.delete(clientName);
                      } else {
                        next.add(clientName);
                      }
                      return next;
                    })
                  }
                  className="w-full flex items-center justify-between px-3 py-2 bg-neutral-50"
                >
                  <div className="text-left">
                    <p className="text-xs font-semibold text-neutral-600 uppercase">{clientName}</p>
                    <p className="text-xs text-neutral-400">{clientProjects.length} projects</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="space-y-1 px-3 pb-2">
                    {clientProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`w-full text-left px-2 py-1 border border-neutral-200 text-sm truncate ${
                          project.id === selectedProjectId ? 'bg-[#143352] text-white' : 'bg-white text-neutral-700'
                        }`}
                      >
                        {project.name}
                        <span className="block text-xs text-neutral-500">
                          {campuses.find((c) => c.id === project.campusId)?.name || 'Campus TBD'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Portfolio</p>
            <h1 className="text-3xl font-heading font-bold text-neutral-900">Pelican State Projects</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects or clients"
                className="pl-10 pr-4 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#143352]"
              />
            </div>
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#143352]"
            >
              <option value="">All Campuses</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-[#143352] text-white px-4 py-2"
            >
              <Plus className="w-4 h-4" /> Add Project
            </button>
          </div>
        </div>

        {selectedProject ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-neutral-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900">Client Info</p>
                  <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600">{selectedProject.status}</span>
                </div>
                <div className="space-y-2 text-sm text-neutral-600">
                  <p className="font-semibold text-neutral-900">{selectedProject.clientName}</p>
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#143352]" />{selectedProject.clientPhone}</p>
                  <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#143352]" />{selectedProject.clientEmail}</p>
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#143352]" />{selectedProject.clientSummary}</p>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 p-5 flex flex-col items-center justify-center">
                <p className="text-sm font-semibold text-neutral-900 mb-2">Project Progress</p>
                <div
                  className="w-44 h-44 rounded-full flex items-center justify-center"
                  style={{
                    background: `conic-gradient(#27AE60 0% ${Math.min(
                      100,
                      Math.round((selectedProject.spentBudget / selectedProject.totalBudget) * 100)
                    )}%, #E5E7EB ${Math.min(
                      100,
                      Math.round((selectedProject.spentBudget / selectedProject.totalBudget) * 100)
                    )}% 100%)`,
                  }}
                >
                  <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center">
                    <span className="text-4xl font-heading font-semibold text-neutral-900">
                      {Math.round((selectedProject.spentBudget / selectedProject.totalBudget) * 100)}%
                    </span>
                    <span className="text-xs text-neutral-500">Budget consumed</span>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900">Cost Performance Index</p>
                  <button className="text-xs text-neutral-500 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filter
                  </button>
                </div>
                <div className="mt-6 space-y-3">
                  {[60, 75, 40, 90].map((value, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs text-neutral-500">Q{idx + 1}</span>
                      <div className="flex-1 h-8 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#143352]" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white border border-neutral-200 p-5 space-y-3">
                <p className="text-sm font-semibold text-neutral-900">Project Status</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs uppercase text-neutral-500">Budget</p>
                    <div className="flex justify-between text-sm text-neutral-600">
                      <span>Total</span>
                      <span>{formatCurrency(selectedProject.totalBudget)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-600">
                      <span>Spent</span>
                      <span>{formatCurrency(selectedProject.spentBudget)}</span>
                    </div>
                    <div className="mt-2 h-2 bg-neutral-100 rounded-full">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((selectedProject.spentBudget / selectedProject.totalBudget) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase text-neutral-500">Start Date</p>
                      <p className="text-sm text-neutral-900">{selectedProject.startDate}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-neutral-500">End Date</p>
                      <p className="text-sm text-neutral-900">{selectedProject.endDate}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 p-5 space-y-3">
                <p className="text-sm font-semibold text-neutral-900">Safety Metrics</p>
                <div className="flex items-center gap-6">
                  <div className="w-28 h-28 rounded-full" style={{ background: 'conic-gradient(#F04040 0% 25%, #F4B400 25% 55%, #27AE60 55% 100%)' }}>
                    <div className="w-20 h-20 bg-white rounded-full mx-auto my-4 flex flex-col items-center justify-center">
                      <span className="text-2xl font-heading text-red-500">12</span>
                      <span className="text-xs text-neutral-500">This Month</span>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'Low Risk', value: 12 },
                      { label: 'Medium', value: 23 },
                      { label: 'Moderate', value: 2 },
                      { label: 'High', value: 4 },
                    ].map((item) => (
                      <div key={item.label} className="border border-neutral-200 p-2 text-center">
                        <p className="text-xs text-neutral-500">{item.label}</p>
                        <p className="text-lg font-semibold text-neutral-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
                <div>
                  <p className="text-lg font-heading font-semibold text-neutral-900">Projects</p>
                  <p className="text-sm text-neutral-500">All projects for {selectedProject.clientName}</p>
                </div>
                <button className="text-sm text-neutral-500 flex items-center gap-1">
                  <Filter className="w-4 h-4" /> Filter
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="text-xs uppercase text-neutral-500">
                    <tr>
                      <th className="text-left px-6 py-3">Project</th>
                      <th className="text-left px-6 py-3">Campus</th>
                      <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Budget</th>
                <th className="text-right px-6 py-3">Active Tasks</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-neutral-700">
              {selectedClientProjects.map((projectRow) => {
                const activeTasks = projectTaskService
                        .getByProject(projectRow.id)
                        .filter((task) => !['Completed', 'Closed', 'Paid', 'Invoiced'].includes(task.status)).length;
                return (
                  <tr
                    key={projectRow.id}
                    className="border-t border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                    onClick={() => {
                      setSelectedProjectId(projectRow.id);
                      navigate(`/projects/${projectRow.id}`);
                    }}
                  >
                          <td className="px-6 py-3 font-medium text-neutral-900">
                            <div>
                              <p>{projectRow.name}</p>
                              <p className="text-xs text-neutral-500 truncate">{projectRow.clientSummary}</p>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-neutral-600">{campuses.find((c) => c.id === projectRow.campusId)?.name || 'Campus TBD'}</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs px-2 py-0.5 font-medium ${projectRow.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'}`}>
                              {projectRow.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-neutral-900">{formatCurrency(projectRow.totalBudget)}</td>
                    <td className="px-6 py-3 text-right text-neutral-600">{activeTasks}</td>
                    <td className="px-6 py-3 text-right text-neutral-600">
                      <span className="inline-flex items-center gap-1 text-[#143352] text-xs font-semibold">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 p-10 text-center text-neutral-500">
            Select a project to view details.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl border border-neutral-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold text-neutral-900">New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-500">Close</button>
            </div>
            <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex items-center gap-4 text-sm text-neutral-600">
                <label className="flex items-center gap-2">
                  <input type="radio" name="clientMode" value="existing" checked={form.clientMode === 'existing'} onChange={(e) => setForm({ ...form, clientMode: e.target.value as 'existing' | 'new' })} />
                  Existing Client
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="clientMode" value="new" checked={form.clientMode === 'new'} onChange={(e) => setForm({ ...form, clientMode: e.target.value as 'existing' | 'new' })} />
                  New Client
                </label>
              </div>
              {form.clientMode === 'existing' ? (
                <select value={form.existingClient} onChange={(e) => setForm({ ...form, existingClient: e.target.value })} className="border border-neutral-300 px-3 py-2 md:col-span-2">
                  <option value="">Select client...</option>
                  {clientOptions.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Client Contact" className="border border-neutral-300 px-3 py-2" />
                  <input value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} placeholder="Client Email" className="border border-neutral-300 px-3 py-2" />
                  <input value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} placeholder="Client Phone" className="border border-neutral-300 px-3 py-2" />
                </>
              )}
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Project Name" className="border border-neutral-300 px-3 py-2" />
              <div className="md:col-span-2 flex items-center gap-4 text-sm text-neutral-600">
                <label className="flex items-center gap-2">
                  <input type="radio" name="campusMode" value="existing" checked={form.campusMode === 'existing'} onChange={(e) => setForm({ ...form, campusMode: e.target.value as 'existing' | 'new' })} />
                  Existing Campus
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="campusMode" value="new" checked={form.campusMode === 'new'} onChange={(e) => setForm({ ...form, campusMode: e.target.value as 'existing' | 'new' })} />
                  Add New Campus
                </label>
              </div>
              {form.campusMode === 'existing' ? (
                <select value={form.campusId} onChange={(e) => setForm({ ...form, campusId: e.target.value })} className="border border-neutral-300 px-3 py-2">
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input value={form.newCampusName} onChange={(e) => setForm({ ...form, newCampusName: e.target.value })} placeholder="Campus Name" className="border border-neutral-300 px-3 py-2" />
                  <input value={form.newCampusFunding} onChange={(e) => setForm({ ...form, newCampusFunding: e.target.value })} placeholder="Funding Source" className="border border-neutral-300 px-3 py-2" />
                  <select value={form.newCampusPriority} onChange={(e) => setForm({ ...form, newCampusPriority: e.target.value as Priority })} className="border border-neutral-300 px-3 py-2">
                    {(['Critical', 'High', 'Medium', 'Low'] as Priority[]).map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <textarea value={form.locationNotes} onChange={(e) => setForm({ ...form, locationNotes: e.target.value })} placeholder="Location / notes" className="border border-neutral-300 px-3 py-2 md:col-span-2" rows={2} />
              <div className="md:col-span-2 space-y-4">
                <JobConversation
                  conversation={conversationState}
                  onStart={handleStartConversation}
                  onAnswer={handleConversationAnswer}
                  onGeneratePlan={handleGeneratePlanFromConversation}
                  generatingPlan={generatingPlan}
                />
                <ScopeAnalysisPanel
                  analysis={scopeAnalysis}
                  onAccept={(template) => handleTemplateOverride(template)}
                  onOverride={(template) => handleTemplateOverride(template)}
                  selectedTemplate={form.templateType}
                />
                <ConsultationChecklist checklist={consultationChecklist} onChecklistChange={handleChecklistChange} />
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
                    <p className="text-xs text-neutral-500">These tasks will be added ahead of the AI plan to cover onsite walkthrough prep.</p>
                  </div>
                )}
                <ResearchSnippets snippets={combinedResearchSnippets} loading={researchLoading} />
              </div>
              <div className="md:col-span-2 flex items-center gap-2 text-sm text-neutral-600">
                <input type="checkbox" checked={autoCreateTasks} onChange={(e) => setAutoCreateTasks(e.target.checked)} />
                Auto-create tasks from AI plan
              </div>
              {selectedTemplateMeta && (
                <div className="md:col-span-2 bg-neutral-50 border border-dashed border-neutral-200 p-3 text-xs text-neutral-600 space-y-1">
                  <p className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                    {selectedTemplateMeta.name}
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#143352] bg-white border border-[#143352]/20 px-2 py-0.5">{selectedTemplateMeta.category}</span>
                  </p>
                  <p>{selectedTemplateMeta.description}</p>
                  <p className="text-[11px] text-neutral-500">Cost guidance: {selectedTemplateMeta.costHeuristic}</p>
                  <p className="text-[11px] text-neutral-500 flex items-center gap-1" title={selectedTemplateMeta.walkthroughQuestions.join(' • ')}>
                    <Info className="w-3 h-3" />
                    {selectedTemplateMeta.walkthroughQuestions.length} prep questions suggested
                  </p>
                </div>
              )}
              {projectPlan && planEdits && (
                <div className="md:col-span-2 bg-neutral-50 border border-neutral-200 p-4 space-y-4 text-sm text-neutral-700">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-900 flex items-center gap-2">
                        {projectPlan.templateName}
                        {selectedTemplateMeta?.category && (
                          <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 border border-neutral-200 px-2 py-0.5">{selectedTemplateMeta.category}</span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500">{projectPlan.description}</p>
                      <p className="text-[11px] text-neutral-500 mt-1">{projectPlan.costHeuristic}</p>
                    </div>
                    <button type="button" onClick={handleRegeneratePlan} className="inline-flex items-center gap-2 text-xs text-[#143352] border border-[#143352] px-3 py-1 uppercase tracking-wide">
                      <RefreshCcw className="w-3.5 h-3.5" /> Regenerate Plan
                    </button>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs text-neutral-500 uppercase tracking-[0.2em] block">
                      Field Questions (one per line)
                      <textarea
                        value={planEdits.questions.join('\n')}
                        onChange={(e) => handleQuestionsChange(e.target.value)}
                        className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                        rows={4}
                      />
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="text-xs text-neutral-500 uppercase tracking-[0.2em] block">
                        Materials Guidance
                        <textarea
                          value={planEdits.materials}
                          onChange={(e) => handleSummaryChange('materials', e.target.value)}
                          className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                          rows={3}
                        />
                      </label>
                      <label className="text-xs text-neutral-500 uppercase tracking-[0.2em] block">
                        Labor Guidance
                        <textarea
                          value={planEdits.labor}
                          onChange={(e) => handleSummaryChange('labor', e.target.value)}
                          className="mt-2 w-full border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
                          rows={3}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-neutral-900">Recommended Tasks</p>
                      <p className="text-xs text-neutral-500">{planEdits.selectedTaskTitles.size} selected</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      {projectPlan.tasks.map((task) => {
                        const isChecked = planEdits.selectedTaskTitles.has(task.title);
                        return (
                          <label key={task.title} className={`flex items-start gap-3 border border-neutral-200 p-3 ${!isChecked ? 'opacity-60' : ''}`}>
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={isChecked}
                              onChange={() => toggleTaskSelection(task.title)}
                            />
                            <div>
                              <p className="font-semibold text-neutral-900 flex items-center gap-2">
                                {task.title}
                                {task.category && <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 border border-neutral-200 px-1.5 py-0.5">{task.category}</span>}
                              </p>
                              <p className="text-xs text-neutral-500">{task.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {!autoCreateTasks && <p className="text-xs text-amber-600 mt-2">Tasks are staged but will only be created if you enable auto-create.</p>}
                  </div>
                </div>
              )}
              <input type="number" value={form.totalBudget} onChange={(e) => setForm({ ...form, totalBudget: Number(e.target.value) })} placeholder="Budget" className="border border-neutral-300 px-3 py-2" />
              <select value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} className="border border-neutral-300 px-3 py-2">
                <option value="">Attach Lead (optional)</option>
                {mockLeads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.companyName}
                  </option>
                ))}
              </select>
              <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} className="border border-neutral-300 px-3 py-2">
                <option value="">Attach Contact (optional)</option>
                {mockContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="border border-neutral-300 px-3 py-2" />
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="border border-neutral-300 px-3 py-2" />
              <div className="md:col-span-2 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-neutral-300 text-neutral-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#143352] text-white">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
