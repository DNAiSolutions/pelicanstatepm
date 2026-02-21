import { useEffect, useMemo, useState } from 'react';
import { mockSites, type Project, type ConsultationChecklist as ConsultationChecklistModel, type IntakeResearchSnippet, type ScopeAnalysisResult, type IntakeConversationState, type Priority } from '../data/pipeline';
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
import { propertyService, type Property as PropertyRecord } from '../services/propertyService';
import { contactService } from '../services/contactService';
import { leadService } from '../services/leadService';
import { siteService } from '../services/siteService';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Loader2, RefreshCcw, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

type PropertyOption = {
  id: string;
  name: string;
  fundingSource?: string;
  priority?: Priority;
};

const mapPropertyOption = (property: PropertyRecord | PropertyOption): PropertyOption => ({
  id: property.id,
  name: property.name,
  fundingSource:
    'fundingSource' in property
      ? property.fundingSource || 'Client Provided'
      : (property as PropertyRecord).funding_source || 'Client Provided',
  priority: property.priority,
});

const STATUS_CLASSES: Record<Project['status'], string> = {
  Planning: 'bg-amber-50 text-amber-700 border border-amber-200',
  PreConstruction: 'bg-sky-50 text-sky-700 border border-sky-200',
  Active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Closeout: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  OnHold: 'bg-rose-50 text-rose-700 border border-rose-200',
  Completed: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const getStatusClass = (status: Project['status']) => STATUS_CLASSES[status] ?? 'bg-neutral-100 text-neutral-700 border border-neutral-200';

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
  const { user } = useAuth();
  const { isAdminProfile, properties: profileProperties, leads: profileLeads, contacts: profileContacts } = useProfileData();
  const profilePropertyOptions = useMemo(() => profileProperties.map(mapPropertyOption), [profileProperties]);
  const [properties, setProperties] = useState<PropertyOption[]>(profilePropertyOptions);
  const [leads, setLeads] = useState(profileLeads);
  const [contacts, setContacts] = useState(profileContacts);
  const propertyAssignments = useMemo(() => user?.propertyAssigned?.filter(Boolean) ?? [], [user?.propertyAssigned]);
  const [supportingDataLoading, setSupportingDataLoading] = useState(isAdminProfile);
  const [projects, setProjects] = useState<any[]>([]);
  const [boardSearch, setBoardSearch] = useState('');
  const [boardPropertyFilter, setBoardPropertyFilter] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    propertyId: profilePropertyOptions[0]?.id || '',
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
      } catch (error) {
        toast.error('Unable to load projects');
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, [isAdminProfile]);

  useEffect(() => {
    if (isAdminProfile) return;
    setProperties(profilePropertyOptions);
    setLeads(profileLeads);
    setContacts(profileContacts);
    setSupportingDataLoading(false);
  }, [isAdminProfile, profilePropertyOptions, profileLeads, profileContacts]);

  useEffect(() => {
    if (!isAdminProfile) return;
    let isMounted = true;
    async function loadSupportingData() {
      try {
        setSupportingDataLoading(true);
        const [propertyData, leadData, contactData] = await Promise.all([
          propertyService.getProperties(),
          leadService.list(),
          contactService.list(),
        ]);
        if (!isMounted) return;
        const scoped = propertyAssignments.length
          ? propertyData.filter((property) => propertyAssignments.includes(property.id))
          : propertyData;
        setProperties(scoped.map(mapPropertyOption));
        setLeads(leadData);
        setContacts(contactData);
      } catch (error) {
        console.error('Failed to load project data', error);
        toast.error('Unable to load project data');
      } finally {
        if (isMounted) {
          setSupportingDataLoading(false);
        }
      }
    }
    loadSupportingData();
    return () => {
      isMounted = false;
    };
  }, [isAdminProfile, propertyAssignments]);

  useEffect(() => {
    if (form.propertyId || properties.length === 0) return;
    setForm((prev) => ({ ...prev, propertyId: properties[0].id }));
  }, [properties, form.propertyId]);

  useEffect(() => {
    if (boardPropertyFilter && !properties.some((property) => property.id === boardPropertyFilter)) {
      setBoardPropertyFilter('');
    }
  }, [properties, boardPropertyFilter]);

  useEffect(() => {
    if (!form.leadId) return;
    const lead = leads.find((item) => item.id === form.leadId);
    if (lead) {
      setForm((prev) => ({
        ...prev,
        clientName: (lead as any).contact_name ?? (lead as any).contactName,
        clientEmail: lead.email,
        clientPhone: lead.phone,
        propertyId: (lead as any).property_id ?? (lead as any).propertyId ?? prev.propertyId,
      }));
    }
  }, [form.leadId, leads]);

  useEffect(() => {
    if (form.clientMode === 'existing' && form.existingClient) {
      const contact = contacts.find((c) => c.company === form.existingClient);
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
  }, [form.clientMode, form.existingClient, contacts]);

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

  const clientOptions = useMemo(() => {
    const names = new Set<string>();
    contacts.forEach((contact) => {
      if (contact.company) {
        names.add(contact.company);
      }
    });
    if (names.size === 0) {
      projects.forEach((project) => names.add(project.client_name));
    }
    return Array.from(names).sort();
  }, [contacts, projects]);

  const boardStatusOptions = useMemo(
    () => ['All', ...Array.from(new Set(projects.map((project) => project.status)))],
    [projects]
  );

  const boardProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(boardSearch.toLowerCase()) ||
        (project.client_name ?? '').toLowerCase().includes(boardSearch.toLowerCase());
      const matchesProperty = !boardPropertyFilter || project.property_id === boardPropertyFilter;
      const matchesStatus = jobStatusFilter === 'All' || project.status === jobStatusFilter;
      return matchesSearch && matchesProperty && matchesStatus;
    });
  }, [projects, boardSearch, boardPropertyFilter, jobStatusFilter]);

  const summarySnapshot = useMemo(() => {
    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let endingWithin = 0;
    let late = 0;
    let requiresInvoicing = 0;
    let actionRequired = 0;
    let unscheduled = 0;
    projects.forEach((project) => {
      const start = project.start_date ? new Date(project.start_date) : null;
      const end = project.end_date ? new Date(project.end_date) : null;
      if (end && end >= now && end <= inThirtyDays) endingWithin += 1;
      if (end && end < now && ['Active', 'Planning'].includes(project.status)) late += 1;
      if (project.status === 'Closeout') requiresInvoicing += 1;
      if (project.status === 'OnHold') actionRequired += 1;
      if (!start) unscheduled += 1;
    });
    return { endingWithin, late, requiresInvoicing, actionRequired, unscheduled };
  }, [projects]);

  const visitStats = useMemo(() => {
    const recent = projects.filter((project) => project.status === 'Active');
    const recentValue = recent.reduce((total, project) => total + (project.total_budget ?? 0), 0);
    const scheduled = projects.filter((project) => project.status === 'PreConstruction');
    const scheduledValue = scheduled.reduce((total, project) => total + (project.total_budget ?? 0), 0);
    return {
      recentCount: recent.length,
      recentValue,
      scheduledCount: scheduled.length,
      scheduledValue,
    };
  }, [projects]);

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
      let propertyId = form.propertyId;
      if (form.propertyMode === 'new') {
        if (!form.newPropertyName.trim()) {
          toast.error('Enter a property name');
          return;
        }
        if (isAdminProfile) {
          const newProperty = await propertyService.createProperty({
            name: form.newPropertyName.trim() as PropertyRecord['name'],
            address: form.locationNotes || 'Address TBD',
            funding_source: form.newPropertyFunding.trim() || 'Client Provided',
            is_historic: form.newPropertyPriority === 'Critical',
            priority: form.newPropertyPriority,
          });
          propertyId = newProperty.id;
          setProperties((prev) => [...prev, mapPropertyOption(newProperty)]);
        } else {
          const newPropertyId = `property-${form.newPropertyName.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
          setProperties((prev) => [
            ...prev,
            {
              id: newPropertyId,
              name: form.newPropertyName.trim(),
              fundingSource: form.newPropertyFunding.trim() || 'Client Provided',
              priority: form.newPropertyPriority,
            },
          ]);
          propertyId = newPropertyId;
        }
      }
      if (!propertyId) {
        toast.error('Select a property');
        return;
      }
      let siteId = '';
      if (isAdminProfile) {
        const site = await siteService.ensureDefaultForProperty(propertyId, {
          name: form.locationNotes || `${form.name} Site`,
          address: form.locationNotes || 'Address TBD',
        });
        siteId = site.id;
      } else {
        let site = mockSites.find((entry) => entry.propertyId === propertyId);
        if (!site) {
          site = {
            id: `site-${Date.now().toString(36)}`,
            propertyId,
            name: form.locationNotes || `${form.name} Site`,
            address: form.locationNotes || 'Address TBD',
            isHistoric: false,
          };
          mockSites.push(site);
        }
        siteId = site.id;
      }
      const selectedLead = form.leadId ? leads.find((lead) => lead.id === form.leadId) : undefined;
      const existingContact = form.existingClient ? contacts.find((contact) => contact.company === form.existingClient) : undefined;
      const finalClientName =
        form.clientMode === 'existing'
          ? form.existingClient || existingContact?.name || form.clientName
          : form.clientName || (selectedLead as any)?.company_name || (selectedLead as any)?.companyName || '';
      const finalClientEmail =
        form.clientMode === 'existing' && form.existingClient && !form.clientEmail
          ? existingContact?.email || form.clientEmail
          : form.clientEmail;
      const finalClientPhone =
        form.clientMode === 'existing' && form.existingClient && !form.clientPhone
          ? existingContact?.phone || form.clientPhone
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
        clientName: finalClientName || (selectedLead as any)?.company_name || (selectedLead as any)?.companyName || '',
        clientEmail: finalClientEmail || selectedLead?.email || '',
        clientPhone: finalClientPhone || selectedLead?.phone || '',
        internalOwnerId: user?.id || 'user-1',
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
      setShowModal(false);
      setForm({
        name: '',
        propertyId: properties[0]?.id || '',
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
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Operations</p>
          <h1 className="text-3xl font-heading font-semibold text-[var(--text-body)]">Jobs</h1>
          <p className="text-sm text-[var(--text-muted)]">Live job tracker</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={supportingDataLoading}
          className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {supportingDataLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} New Job
        </button>
      </header>

      <section className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {[
            { label: 'Ending within 30 days', value: summarySnapshot.endingWithin, accent: 'border-amber-200 bg-amber-50 text-amber-700' },
            { label: 'Late', value: summarySnapshot.late, accent: 'border-red-200 bg-red-50 text-red-700' },
            { label: 'Requires invoicing', value: summarySnapshot.requiresInvoicing, accent: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
            { label: 'Action required', value: summarySnapshot.actionRequired, accent: 'border-orange-200 bg-orange-50 text-orange-700' },
            { label: 'Unscheduled', value: summarySnapshot.unscheduled, accent: 'border-slate-200 bg-slate-50 text-slate-700' },
          ].map((card) => (
            <div key={card.label} className={`p-4 border ${card.accent} rounded-3xl`}> 
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{card.label}</p>
              <p className="text-3xl font-heading font-semibold mt-2">{card.value}</p>
              <p className="text-xs text-[var(--text-muted)]">Jobs</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Recent visits (30 days)</p>
              <h3 className="text-2xl font-heading">{visitStats.recentCount}</h3>
              <p className="text-xs text-[var(--text-muted)]">{formatCurrency(visitStats.recentValue)} in progress</p>
            </div>
            <div className="text-xs text-[var(--brand-primary)] font-semibold">On track</div>
          </div>
          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Visits scheduled</p>
              <h3 className="text-2xl font-heading">{visitStats.scheduledCount}</h3>
              <p className="text-xs text-[var(--text-muted)]">{formatCurrency(visitStats.scheduledValue)} booked</p>
            </div>
            <div className="text-xs text-red-600 font-semibold">{visitStats.scheduledCount === 0 ? 'Need bookings' : 'Scheduled'}</div>
          </div>
          <div className="card p-5 bg-gradient-to-br from-[#fef3c7] to-white border-amber-100">
            <p className="text-sm text-amber-800 font-semibold">How can you win more work?</p>
            <p className="text-xs text-amber-900 mt-2 leading-relaxed">Add visits to late jobs and let Pelican Assist keep clients in the loop.</p>
            <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">
              Learn more with Pelican Assist →
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Jobs</p>
            <h2 className="text-xl font-heading font-semibold text-[var(--text-body)]">Live Job Tracker</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-[var(--border-subtle)]">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
              <input
                value={boardSearch}
                onChange={(e) => setBoardSearch(e.target.value)}
                placeholder="Search jobs or clients"
                className="w-full pl-10 pr-4 py-2 border rounded-full"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {boardStatusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setJobStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${
                    jobStatusFilter === status ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <select
              value={boardPropertyFilter}
              onChange={(e) => setBoardPropertyFilter(e.target.value)}
              className="px-3 py-2 border rounded-full text-sm"
            >
              <option value="">All Properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="text-left px-6 py-3">Job</th>
                  <th className="text-left px-6 py-3">Client</th>
                  <th className="text-left px-6 py-3">Property</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Schedule</th>
                  <th className="text-right px-6 py-3">Total</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-neutral-700">
                {boardProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-t border-[var(--border-subtle)] hover:bg-[var(--brand-sand)] cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <td className="px-6 py-3 font-medium text-[var(--text-body)]">
                      <p>{project.name}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{project.client_summary || 'No summary yet'}</p>
                    </td>
                    <td className="px-6 py-3 text-[var(--text-muted)]">{project.client_name}</td>
                    <td className="px-6 py-3 text-[var(--text-muted)]">
                      {properties.find((c) => c.id === project.property_id)?.name || 'Property TBD'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusClass(project.status)}`}>{project.status}</span>
                    </td>
                    <td className="px-6 py-3 text-[var(--text-muted)]">
                      {project.start_date} → {project.end_date}
                    </td>
                    <td className="px-6 py-3 text-right text-[var(--text-body)]">{formatCurrency(project.total_budget)}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${project.id}`);
                        }}
                        className="text-sm text-[var(--brand-primary)] hover:underline"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
                {boardProjects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-[var(--text-muted)]">
                      No jobs match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      

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
                  <input type="radio" name="propertyMode" value="existing" checked={form.propertyMode === 'existing'} onChange={(e) => setForm({ ...form, propertyMode: e.target.value as 'existing' | 'new' })} />
                  Existing Property
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="propertyMode" value="new" checked={form.propertyMode === 'new'} onChange={(e) => setForm({ ...form, propertyMode: e.target.value as 'existing' | 'new' })} />
                  Add New Property
                </label>
              </div>
              {form.propertyMode === 'existing' ? (
                <select value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })} className="border border-neutral-300 px-3 py-2">
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              ) : (
                 <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                   <input value={form.newPropertyName} onChange={(e) => setForm({ ...form, newPropertyName: e.target.value })} placeholder="Property Name" className="border border-neutral-300 px-3 py-2" />
                  <input value={form.newPropertyFunding} onChange={(e) => setForm({ ...form, newPropertyFunding: e.target.value })} placeholder="Funding Source" className="border border-neutral-300 px-3 py-2" />
                  <select value={form.newPropertyPriority} onChange={(e) => setForm({ ...form, newPropertyPriority: e.target.value as Priority })} className="border border-neutral-300 px-3 py-2">
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
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#0f2749] bg-white border border-[#0f2749]/20 px-2 py-0.5">{selectedTemplateMeta.category}</span>
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
                    <button type="button" onClick={handleRegeneratePlan} className="inline-flex items-center gap-2 text-xs text-[#0f2749] border border-[#0f2749] px-3 py-1 uppercase tracking-wide">
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
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {(lead as any).company_name ?? (lead as any).companyName}
                  </option>
                ))}
              </select>
              <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} className="border border-neutral-300 px-3 py-2">
                <option value="">Attach Contact (optional)</option>
                {contacts.map((contact) => (
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
                <button type="submit" className="px-4 py-2 bg-[#0f2749] text-white">
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
