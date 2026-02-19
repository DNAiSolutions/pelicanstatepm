import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  mockCampuses,
  mockSites,
  mockUsers,
  type Contact,
  type Lead,
  type Project,
  type WorkOrder,
  type Contract,
  type Milestone,
  type ScheduleOfValuesEntry,
  type CostLedgerEntry,
  type AIContractRecommendation,
  type AIPricingSnapshot,
  type CostLedgerCategory,
  type Invoice,
  type FinancialAuditEntry,
  type PermitRecord,
  type PermitInspection,
  type HistoricArtifact,
} from '../data/pipeline';
import { projectService } from '../services/projectService';
import { leadService } from '../services/leadService';
import { contactService } from '../services/contactService';
import { projectTaskService, type TaskTemplate } from '../services/projectTaskService';
import { contractService } from '../services/contractService';
import { aiDecisionService } from '../services/aiDecisionService';
import { aiPricingEngine, type PricingInput } from '../services/aiPricingEngine';
import { aiEstimateService } from '../services/aiEstimateService';
import { paymentSyncService } from '../services/paymentSyncService';
import { auditLogService } from '../services/auditLogService';
import { permitService } from '../services/permitService';
import { historicEvidenceService } from '../services/historicEvidenceService';
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Plus,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

type Tab = 'overview' | 'board' | 'list' | 'plan' | 'financials' | 'contracts' | 'milestones' | 'ledger' | 'permits' | 'historic';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [financialTotals, setFinancialTotals] = useState<{ contractValue: number; amountBilled: number; amountEarned: number; grossMargin: number; retainageHeld: number }>({ contractValue: 0, amountBilled: 0, amountEarned: 0, grossMargin: 0, retainageHeld: 0 });
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [scheduleOfValues, setScheduleOfValues] = useState<ScheduleOfValuesEntry[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<CostLedgerEntry[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AIContractRecommendation[]>([]);
  const [aiPricingSnapshots, setAiPricingSnapshots] = useState<AIPricingSnapshot[]>([]);
  const [ledgerForm, setLedgerForm] = useState<{ contractId: string; category: CostLedgerCategory; description: string; committedAmount?: number; actualAmount?: number; vendorId?: string }>(() => ({ contractId: '', category: 'Labor', description: '', committedAmount: undefined, actualAmount: undefined, vendorId: '' }));
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceAudit, setSelectedInvoiceAudit] = useState<FinancialAuditEntry[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [syncingStripeInvoiceId, setSyncingStripeInvoiceId] = useState<string>('');
  const [syncingQboInvoiceId, setSyncingQboInvoiceId] = useState<string>('');
  const [permits, setPermits] = useState<PermitRecord[]>([]);
  const [inspectionsByPermit, setInspectionsByPermit] = useState<Record<string, PermitInspection[]>>({});
  const [permitForm, setPermitForm] = useState({
    jurisdictionName: '',
    jurisdictionType: 'City' as PermitRecord['jurisdictionType'],
    permitType: 'Building' as PermitRecord['permitType'],
    codeSet: 'IBC' as PermitRecord['codeSet'],
    codeVersion: '2021',
    reviewerAuthority: 'LocalAHJ' as PermitRecord['reviewerAuthority'],
    reviewerContact: '',
    status: 'Needed' as PermitRecord['status'],
    notes: '',
  });
  const [inspectionForm, setInspectionForm] = useState({ permitId: '', inspectionType: 'Rough' as PermitInspection['inspectionType'], scheduledAt: '' });
  const [historicArtifacts, setHistoricArtifacts] = useState<HistoricArtifact[]>([]);
  const [historicForm, setHistoricForm] = useState({ artifactType: 'MaterialSpec' as HistoricArtifact['artifactType'], description: '', evidenceUrls: '' });
  const [creatingEstimate, setCreatingEstimate] = useState(false);
  const [lastEstimateResult, setLastEstimateResult] = useState<{ total: number; workRequestId: string } | null>(null);
  const currentUser = useMemo(() => mockUsers.find((user) => user.id === 'user-1') || mockUsers[0], []);
  const canManageFinancials = useMemo(() => (currentUser ? ['Owner', 'Finance'].includes(currentUser.role) : false), [currentUser]);
  const canRunAIRecommendations = useMemo(() => (currentUser ? ['Owner', 'Finance', 'PM'].includes(currentUser.role) : false), [currentUser]);
  const canRunAIPricing = useMemo(() => (currentUser ? ['Owner', 'Finance'].includes(currentUser.role) : false), [currentUser]);

  const [newLead, setNewLead] = useState({ companyName: '', contactName: '', email: '', phone: '', estimatedValue: 25000 });
  const [newContact, setNewContact] = useState<{ name: string; title: string; email: string; phone: string; type: Contact['type'] }>({
    name: '',
    title: '',
    email: '',
    phone: '',
    type: 'Client',
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTemplate, setTaskTemplate] = useState<TaskTemplate>('default');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', locationDetail: '', priority: 'Medium' as WorkOrder['priority'] });
  const [aiSuggestions, setAiSuggestions] = useState<{ questions: string[]; materials: string; labor: string } | null>(null);

  useEffect(() => {
    async function load() {
      if (!projectId) {
        navigate('/projects');
        return;
      }
    try {
      setLoading(true);
      const proj = await projectService.getProject(projectId);
      if (!proj) {
        navigate('/projects');
        return;
      }
      const projLeads = await projectService.getProjectLeads(projectId);
      const projContacts = await projectService.getProjectContacts(projectId);
      const projTasks = projectTaskService.getByProject(projectId);
      const financialSnapshot = await projectService.getFinancialSnapshot(projectId);
      const contractList = financialSnapshot.contracts;
      const projectInvoices = await projectService.getProjectInvoices(projectId);
      const projectPermits = await projectService.getProjectPermits(projectId);
      const inspectionMap: Record<string, PermitInspection[]> = {};
      projectPermits.forEach((permit) => {
        inspectionMap[permit.id] = permitService.listInspections(permit.id);
      });
      const projectArtifacts = await projectService.getProjectHistoricArtifacts(projectId);
      setProject(proj);
      setLeads(projLeads);
      setContacts(projContacts);
      setTasks(projTasks);
      setContracts(contractList);
      setFinancialTotals(financialSnapshot.totals);
      setSelectedContractId((prev) => prev || contractList[0]?.id || '');
      setLedgerEntries(contractService.listCostLedger(projectId));
      setAiRecommendations(aiDecisionService.listContractRecommendations(projectId));
      setAiPricingSnapshots(aiDecisionService.listPricingSnapshots(projectId));
      setLedgerForm((prev) => ({ ...prev, contractId: contractList[0]?.id || '' }));
      setInvoices(projectInvoices);
      setPermits(projectPermits);
      setInspectionsByPermit(inspectionMap);
      setHistoricArtifacts(projectArtifacts);
    } catch (error) {
      toast.error('Unable to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
      }
    }
    load();
  }, [projectId, navigate]);

  useEffect(() => {
    if (taskForm.title || taskForm.description) {
      setAiSuggestions(projectTaskService.generateSuggestions(taskTemplate, taskForm.description));
    } else {
      setAiSuggestions(null);
    }
  }, [taskTemplate, taskForm.title, taskForm.description]);

  useEffect(() => {
    if (!selectedContractId) {
      setMilestones([]);
      setScheduleOfValues([]);
      return;
    }
    setMilestones(contractService.getMilestones(selectedContractId));
    setScheduleOfValues(contractService.getScheduleOfValues(selectedContractId));
    setLedgerForm((prev) => ({ ...prev, contractId: selectedContractId }));
  }, [selectedContractId]);

  const refreshInvoices = async () => {
    if (!project) return;
    const projectInvoices = await projectService.getProjectInvoices(project.id);
    setInvoices(projectInvoices);
  };

  const refreshPermits = () => {
    if (!project) return;
    const projectPermits = permitService.list(project.id);
    const map: Record<string, PermitInspection[]> = {};
    projectPermits.forEach((permit) => {
      map[permit.id] = permitService.listInspections(permit.id);
    });
    setPermits(projectPermits);
    setInspectionsByPermit(map);
  };

  const site = useMemo(() => mockSites.find((s) => s.id === project?.siteId), [project]);
  const campus = useMemo(() => mockCampuses.find((c) => c.id === project?.campusId), [project]);
  const owner = useMemo(() => mockUsers.find((u) => u.id === project?.internalOwnerId), [project]);
  const selectedContract = useMemo(() => contracts.find((contract) => contract.id === selectedContractId), [contracts, selectedContractId]);
  const isHistoricProject = useMemo(() => {
    if (site?.isHistoric) return true;
    if (project?.clientSummary?.toLowerCase().includes('historic')) return true;
    return false;
  }, [site, project]);

  const columns = useMemo(() => {
    const map = { todo: [] as WorkOrder[], inprogress: [] as WorkOrder[], done: [] as WorkOrder[] };
    tasks.forEach((task) => {
      map[projectTaskService.getColumnForStatus(task.status)].push(task);
    });
    return map;
  }, [tasks]);

  const handleStatusChange = (taskId: string, status: WorkOrder['status']) => {
    const updated = projectTaskService.updateStatus(taskId, status);
    if (updated) {
      setTasks((prev) => prev.map((task) => (task.id === updated.id ? { ...task, status } : task)));
    }
  };

  const handleAddLead = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    try {
      const lead = await leadService.create({
        ...newLead,
        stage: 'New',
        source: 'Inbound',
        notes: 'Captured in project workspace',
        campusId: project.campusId,
        projectId: project.id,
        contactIds: [],
      });
      setLeads((prev) => [...prev, lead]);
      setNewLead({ companyName: '', contactName: '', email: '', phone: '', estimatedValue: 25000 });
      toast.success('Lead added');
    } catch (error) {
      toast.error('Unable to add lead');
    }
  };

  const handleAddContact = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    try {
      const contact = await contactService.create({
        ...newContact,
        company: project.clientName,
        campusId: project.campusId,
        projectIds: [project.id],
        leadIds: [],
        preferredChannel: 'Email',
        notes: 'Added in project workspace',
      });
      setContacts((prev) => [...prev, contact]);
      setNewContact({ name: '', title: '', email: '', phone: '', type: 'Client' });
      toast.success('Contact added');
    } catch (error) {
      toast.error('Unable to add contact');
    }
  };

  const handleAddLedgerEntry = (event: React.FormEvent) => {
    event.preventDefault();
    if (!project || !ledgerForm.contractId) return;
    if (!canManageFinancials || !currentUser) {
      toast.error('You do not have permission to record financial entries.');
      return;
    }
    const entry = contractService.addCostLedgerEntry({
      projectId: project.id,
      contractId: ledgerForm.contractId,
      category: ledgerForm.category,
      description: ledgerForm.description,
      committedAmount: ledgerForm.committedAmount ? Number(ledgerForm.committedAmount) : undefined,
      actualAmount: ledgerForm.actualAmount ? Number(ledgerForm.actualAmount) : undefined,
      vendorId: ledgerForm.vendorId,
      recordedBy: currentUser.id,
    });
    setLedgerEntries((prev) => [...prev, entry]);
    toast.success('Cost ledger updated');
    setLedgerForm((prev) => ({ ...prev, description: '', committedAmount: undefined, actualAmount: undefined, vendorId: '' }));
  };

  const handleAddPermit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    permitService.create({
      projectId: project.id,
      jurisdictionName: permitForm.jurisdictionName,
      jurisdictionType: permitForm.jurisdictionType,
      permitType: permitForm.permitType,
      codeSet: permitForm.codeSet,
      codeVersion: permitForm.codeVersion,
      reviewerAuthority: permitForm.reviewerAuthority,
      reviewerContact: permitForm.reviewerContact,
      status: permitForm.status,
      notes: permitForm.notes,
    });
    refreshPermits();
    setPermitForm((prev) => ({ ...prev, jurisdictionName: '', reviewerContact: '', notes: '' }));
    toast.success('Permit record added');
  };

  const handleAddInspection = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inspectionForm.permitId) {
      toast.error('Select a permit');
      return;
    }
    permitService.addInspection({
      permitId: inspectionForm.permitId,
      inspectionType: inspectionForm.inspectionType,
      scheduledAt: inspectionForm.scheduledAt || undefined,
    });
    refreshPermits();
    setInspectionForm((prev) => ({ ...prev, scheduledAt: '' }));
    toast.success('Inspection logged');
  };

  const handleGenerateRecommendation = () => {
    if (!project) return;
    if (!canRunAIRecommendations) {
      toast.error('You do not have permission to run AI recommendations.');
      return;
    }
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const durationDays = Math.max(45, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const recommendation = aiDecisionService.generateRecommendation(project.id, {
      scopeClarity: project.status === 'Planning' ? 2 : project.status === 'PreConstruction' ? 3 : 4,
      estimatedValue: project.totalBudget,
      historicFlag: site?.isHistoric,
      permitComplexity: site?.isHistoric ? 'High' : 'Medium',
      durationDays,
      clientType: campus?.name,
      riskTolerance: project.status === 'Planning' ? 'Low' : 'Medium',
    });
    setAiRecommendations((prev) => [recommendation, ...prev]);
    toast.success('AI contract recommendation generated');
  };

  const handleGeneratePricingSnapshot = () => {
    if (!project) return;
    if (!canRunAIPricing) {
      toast.error('You do not have permission to run AI pricing.');
      return;
    }
    try {
      const start = new Date(project.startDate);
      const end = new Date(project.endDate);
      const durationDays = Math.max(60, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const budget = project.totalBudget || 50000;
      const laborMix = [
        { laborClass: 'pm', hours: Math.max(32, Math.round(durationDays / 7)) },
        { laborClass: 'carpenter', hours: Math.max(80, Math.round(budget / 900)) },
        { laborClass: 'laborer', hours: Math.max(40, Math.round(budget / 1800)) },
      ];
      const materials = [
        { name: 'Building materials', quantity: 1, unitCost: budget * 0.25, escalationPercent: project.status === 'Planning' ? 0.08 : 0.05 },
        { name: 'Finish materials', quantity: 1, unitCost: budget * 0.15, escalationPercent: site?.isHistoric ? 0.1 : 0.04 },
      ];
      const subcontractors = [
        { name: 'MEP subcontractor', quote: budget * 0.2, markupPercent: 0.12 },
        { name: 'Specialty trade', quote: budget * 0.1, markupPercent: 0.15 },
      ];
      const equipment = [
        { description: 'Equipment rentals', hours: durationDays * 3, rate: 45 },
      ];
      const permits = site?.isHistoric
        ? [{ description: 'Historic review + permits', cost: 3500 }]
        : [{ description: 'Municipal permits', cost: 1200 }];

      const pricingInput: PricingInput = {
        contractId: selectedContractId || contracts[0]?.id,
        scopeClarity: project.status === 'Planning' ? 2 : project.status === 'PreConstruction' ? 3 : 4,
        projectSize: budget,
        historicFlag: site?.isHistoric,
        permitComplexity: site?.isHistoric ? 'High' : 'Medium',
        durationDays,
        laborMix,
        materials,
        subcontractors,
        equipment,
        permits,
        overheadRate: 0.15,
        baseMargin: 0.28,
      };

      const result = aiPricingEngine.generatePricing(project.id, pricingInput);
      setAiPricingSnapshots((prev) => [result.snapshot, ...prev]);
      toast.success(`AI pricing generated: ${formatCurrency(result.totalPrice)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to generate AI pricing');
    }
  };

  const handleGenerateAiEstimate = async () => {
    if (!project) return;
    setCreatingEstimate(true);
    try {
      const result = await aiEstimateService.generateEstimateForProject(project, leads, tasks, project.walkthroughNotes || project.clientSummary);
      setLastEstimateResult({ total: result.total, workRequestId: result.workRequestId });
      setTasks((prev) => prev.map((task) => (task.id === result.workRequestId ? { ...task, status: 'AwaitingApproval' } : task)));
      setLeads((prev) =>
        prev.map((lead) =>
          lead.projectId === project.id && !['Proposal', 'Negotiation', 'Won'].includes(lead.stage)
            ? {
                ...lead,
                stage: 'Proposal',
                nextStep: 'Send AI estimate for approval',
                recommendedNextStep: 'SendAiEstimate' as Lead['recommendedNextStep'],
              }
            : lead
        )
      );
      toast.success(`Estimate draft created (${formatCurrency(result.total)})`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create estimate');
    } finally {
      setCreatingEstimate(false);
    }
  };

  const handleSyncStripe = async (invoiceId: string) => {
    if (!currentUser || !canManageFinancials) {
      toast.error('Only finance or owner roles can sync payments.');
      return;
    }
    try {
      setSyncingStripeInvoiceId(invoiceId);
      await paymentSyncService.syncInvoiceToStripe(invoiceId, currentUser.id);
      await refreshInvoices();
      toast.success('Invoice synced to Stripe');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sync to Stripe');
    } finally {
      setSyncingStripeInvoiceId('');
    }
  };

  const handleSyncQuickBooks = async (invoiceId: string) => {
    if (!currentUser || !canManageFinancials) {
      toast.error('Only finance or owner roles can sync payments.');
      return;
    }
    try {
      setSyncingQboInvoiceId(invoiceId);
      const customerName = project?.clientName || 'Client';
      await paymentSyncService.syncInvoiceToQuickBooks(invoiceId, customerName, currentUser.id);
      await refreshInvoices();
      toast.success('Invoice synced to QuickBooks');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sync to QuickBooks');
    } finally {
      setSyncingQboInvoiceId('');
    }
  };

  const handleViewAuditLog = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setSelectedInvoiceAudit(auditLogService.listByEntity(invoiceId));
  };

  const handleAddHistoricArtifact = (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    const evidence = historicForm.evidenceUrls
      .split(/\n|,/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
    const artifact = historicEvidenceService.create({
      projectId: project.id,
      artifactType: historicForm.artifactType,
      description: historicForm.description,
      evidenceUrls: evidence,
      reviewerRequired: true,
    });
    setHistoricArtifacts((prev) => [artifact, ...prev]);
    setHistoricForm({ artifactType: historicForm.artifactType, description: '', evidenceUrls: '' });
    toast.success('Historic artifact recorded');
  };

  const handleAddTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!project) return;
    const suggestion = projectTaskService.generateSuggestions(taskTemplate, taskForm.description);
    const newTask = projectTaskService.createTask(project.id, {
      title: taskForm.title,
      description: taskForm.description,
      locationDetail: taskForm.locationDetail,
      priority: taskForm.priority,
      siteId: project.siteId,
      aiQuestions: suggestion.questions,
      aiMaterialSummary: suggestion.materials,
      aiLaborSummary: suggestion.labor,
    });
    setTasks((prev) => [...prev, newTask]);
    setShowTaskModal(false);
    setTaskForm({ title: '', description: '', locationDetail: '', priority: 'Medium' });
    toast.success('Task created');
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#143352]/20 border-t-[#143352] rounded-full animate-spin" />
      </div>
    );
  }

  const budgetProgress = Math.min(100, Math.round((project.spentBudget / project.totalBudget) * 100));

  const overviewContent = (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-5 space-y-2">
          <p className="text-sm font-semibold text-neutral-900">Client Info</p>
          <p className="font-semibold text-neutral-900">{project.clientName}</p>
          <p className="text-sm text-neutral-600 flex items-center gap-2"><Phone className="w-4 h-4" /> {project.clientPhone}</p>
          <p className="text-sm text-neutral-600 flex items-center gap-2"><Mail className="w-4 h-4" /> {project.clientEmail}</p>
          <p className="text-xs text-neutral-500">{project.clientSummary}</p>
        </div>
        <div className="bg-white border border-neutral-200 p-5 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-neutral-900 mb-3">Budget Progress</p>
          <div className="w-44 h-44 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#27AE60 0% ${budgetProgress}%, #E5E7EB ${budgetProgress}% 100%)` }}>
            <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center">
              <span className="text-4xl font-heading font-semibold text-neutral-900">{budgetProgress}%</span>
              <span className="text-xs text-neutral-500">Spend</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Cost Performance Index</p>
          {[60, 82, 43, 90].map((value, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-neutral-500">
              <span>Q{idx + 1}</span>
              <div className="flex-1 h-2 bg-neutral-100 rounded-full">
                <div className="h-full bg-[#143352] rounded-full" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 p-5 space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Budget & Timeline</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600">
            <div>
              <p className="text-xs uppercase text-neutral-500">Total Budget</p>
              <p className="text-lg font-semibold text-neutral-900">{formatCurrency(project.totalBudget)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">Spent</p>
              <p className="text-lg font-semibold text-neutral-900">{formatCurrency(project.spentBudget)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">Start</p>
              <p>{project.startDate}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">End</p>
              <p>{project.endDate}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Safety Snapshot</p>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full" style={{ background: 'conic-gradient(#F04040 0% 25%, #F4B400 25% 55%, #27AE60 55% 100%)' }}>
              <div className="w-16 h-16 bg-white rounded-full mx-auto my-4 flex flex-col items-center justify-center">
                <span className="text-2xl font-heading text-red-500">12</span>
                <span className="text-xs text-neutral-500">Alerts</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3 text-sm text-neutral-600">
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
      </section>

      <section className="bg-white border border-neutral-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <div>
            <p className="text-lg font-heading font-semibold text-neutral-900">Projects</p>
            <p className="text-sm text-neutral-500">Work orders connected to this project</p>
          </div>
          <button className="text-sm text-neutral-500">Filter</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3 text-left">Task</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Priority</th>
                <th className="px-6 py-3 text-left">Target</th>
              </tr>
            </thead>
            <tbody className="text-sm text-neutral-700">
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-neutral-100">
                  <td className="px-6 py-3 font-medium">{task.title}</td>
                  <td className="px-6 py-3">{task.status}</td>
                  <td className="px-6 py-3">{task.priority}</td>
                  <td className="px-6 py-3">{task.targetEndDate || 'TBD'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading font-semibold text-neutral-900">Pipeline Leads</h3>
            <span className="text-xs text-neutral-500">{leads.length} linked</span>
          </div>
          {leads.length === 0 ? (
            <p className="text-sm text-neutral-500">No leads yet.</p>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div key={lead.id} className="border border-neutral-200 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">{lead.companyName}</p>
                      <p className="text-xs text-neutral-500">Stage: {lead.stage}</p>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">{formatCurrency(lead.estimatedValue)}</span>
                  </div>
                  <p className="text-sm text-neutral-600">Next: {lead.nextStep || 'TBD'}</p>
                </div>
              ))}
            </div>
          )}
          <form className="grid grid-cols-2 gap-3" onSubmit={handleAddLead}>
            <input value={newLead.companyName} onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })} required placeholder="Company" className="border border-neutral-300 px-3 py-2" />
            <input value={newLead.contactName} onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })} required placeholder="Contact" className="border border-neutral-300 px-3 py-2" />
            <input value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} required placeholder="Email" className="border border-neutral-300 px-3 py-2" />
            <input value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} required placeholder="Phone" className="border border-neutral-300 px-3 py-2" />
            <input type="number" value={newLead.estimatedValue} onChange={(e) => setNewLead({ ...newLead, estimatedValue: Number(e.target.value) })} placeholder="Est. Value" className="border border-neutral-300 px-3 py-2" />
            <button type="submit" className="bg-[#143352] text-white flex items-center justify-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Lead
            </button>
          </form>
        </div>
        <div className="bg-white border border-neutral-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading font-semibold text-neutral-900">Client + Team Contacts</h3>
            <span className="text-xs text-neutral-500">{contacts.length} saved</span>
          </div>
          {contacts.length === 0 ? (
            <p className="text-sm text-neutral-500">No contacts yet.</p>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="border border-neutral-200 p-3">
                  <p className="font-medium text-neutral-900">{contact.name}</p>
                  <p className="text-xs text-neutral-500">{contact.title} • {contact.type}</p>
                  <p className="text-sm text-neutral-600 flex items-center gap-2"><Mail className="w-4 h-4" /> {contact.email}</p>
                  <p className="text-sm text-neutral-600 flex items-center gap-2"><Phone className="w-4 h-4" /> {contact.phone}</p>
                </div>
              ))}
            </div>
          )}
          <form className="grid grid-cols-2 gap-3" onSubmit={handleAddContact}>
            <input value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} required placeholder="Name" className="border border-neutral-300 px-3 py-2" />
            <input value={newContact.title} onChange={(e) => setNewContact({ ...newContact, title: e.target.value })} required placeholder="Title" className="border border-neutral-300 px-3 py-2" />
            <input value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} required placeholder="Email" className="border border-neutral-300 px-3 py-2" />
            <input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} required placeholder="Phone" className="border border-neutral-300 px-3 py-2" />
            <select value={newContact.type} onChange={(e) => setNewContact({ ...newContact, type: e.target.value as Contact['type'] })} className="border border-neutral-300 px-3 py-2">
              <option value="Client">Client</option>
              <option value="Internal">Internal</option>
              <option value="Vendor">Vendor</option>
              <option value="Partner">Partner</option>
            </select>
            <button type="submit" className="bg-[#143352] text-white flex items-center justify-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          </form>
        </div>
      </section>
    </div>
  );

  const boardContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">Drag cards to update status. Costs roll into overview.</p>
        <button onClick={() => setShowTaskModal(true)} className="inline-flex items-center gap-2 bg-[#143352] text-white px-4 py-2 text-sm">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'todo', title: 'To Do', count: columns.todo.length },
          { id: 'inprogress', title: 'In Progress', count: columns.inprogress.length },
          { id: 'done', title: 'Done', count: columns.done.length },
        ].map((column) => (
          <div key={column.id} className="bg-white border border-neutral-200 p-4 space-y-3 min-h-[320px] flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">{column.title}</p>
              <span className="text-xs text-neutral-500">{column.count}</span>
            </div>
            <div className="space-y-3 flex-1">
              {columns[column.id as keyof typeof columns].map((task) => (
                <div key={task.id} className="border border-neutral-200 p-3 space-y-2">
                  <p className="text-sm font-semibold text-neutral-900">{task.title}</p>
                  <p className="text-xs text-neutral-500">{task.description}</p>
                  <p className="text-xs text-neutral-500">Materials: {task.aiMaterialSummary || 'TBD'}</p>
                  <p className="text-xs text-neutral-500">Labor: {task.aiLaborSummary || 'TBD'}</p>
                  <select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value as WorkOrder['status'])} className="w-full border border-neutral-300 px-2 py-1 text-xs">
                    {['Requested','Scoped','AwaitingApproval','Approved','Scheduled','InProgress','Blocked','Completed','Invoiced','Paid','Closed'].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {columns[column.id as keyof typeof columns].length === 0 && (
                <p className="text-xs text-neutral-500">No tasks yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );



  const planContent = (
    <div className="bg-white border border-neutral-200 p-6 space-y-4">
      <h3 className="text-lg font-heading font-semibold text-neutral-900">Construction Plan & Layers</h3>
      <p className="text-sm text-neutral-600">Use this area to upload drawings, layer notes, and walkthrough templates. Future release will include blueprint annotations.</p>
      <div className="border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
        Drag plan files here or click to upload (coming soon).
      </div>
    </div>
  );

  const contractSelector = (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Contracts</p>
      <div className="flex flex-wrap gap-2">
        {contracts.length === 0 && <span className="text-sm text-neutral-500">No contracts yet.</span>}
        {contracts.map((contract) => (
          <button
            key={contract.id}
            onClick={() => setSelectedContractId(contract.id)}
            className={`px-3 py-1.5 text-xs border ${selectedContractId === contract.id ? 'bg-[#143352] text-white border-[#143352]' : 'border-neutral-200 text-neutral-600'}`}
          >
            {contract.contractType} • {contract.billingMethod}
          </button>
        ))}
      </div>
    </div>
  );

  const financialCards = [
    { label: 'Contract Value', value: formatCurrency(financialTotals.contractValue) },
    { label: 'Billed to Date', value: formatCurrency(financialTotals.amountBilled) },
    { label: 'Earned (SOV)', value: formatCurrency(financialTotals.amountEarned) },
    { label: 'Gross Margin', value: formatCurrency(financialTotals.grossMargin) },
    { label: 'Retainage Held', value: formatCurrency(financialTotals.retainageHeld) },
  ];

  const permitStatusOptions: PermitRecord['status'][] = ['NotRequired', 'Needed', 'Drafting', 'Submitted', 'InReview', 'RevisionsRequired', 'Approved', 'Issued', 'Finaled', 'Closed'];
  const permitTypes: PermitRecord['permitType'][] = ['Building', 'Electrical', 'Mechanical', 'Plumbing', 'Demolition', 'Signage', 'Other'];
  const historicTypes: HistoricArtifact['artifactType'][] = ['MaterialSpec', 'MethodStatement', 'ConditionAssessment', 'ReplacementJustification', 'ReviewComment'];

  const financialsContent = (
    <div className="space-y-6">
      <section className="bg-white border border-neutral-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {financialCards.map((card) => (
            <div key={card.label} className="bg-neutral-50 border border-neutral-100 p-4">
              <p className="text-xs uppercase text-neutral-500">{card.label}</p>
              <p className="text-xl font-heading font-semibold text-neutral-900">{card.value}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-white border border-neutral-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-heading font-semibold text-neutral-900">Invoices & Payments</p>
            <p className="text-sm text-neutral-500">Track sync status across Stripe + QuickBooks.</p>
          </div>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-neutral-500">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2 text-left">Invoice #</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-left">Stripe</th>
                  <th className="px-4 py-2 text-left">QuickBooks</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2 font-medium text-neutral-900">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 text-xs border border-neutral-200">{invoice.status}</span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-neutral-900">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="px-4 py-2 text-neutral-600 text-xs">
                      {invoice.stripePaymentIntentId ? (
                        <span className="text-green-700">{invoice.stripePaymentIntentId}</span>
                      ) : (
                        <button
                          onClick={() => handleSyncStripe(invoice.id)}
                          disabled={!canManageFinancials || !!syncingStripeInvoiceId}
                          className="text-[#143352] underline disabled:opacity-50"
                          title={!canManageFinancials ? 'Only finance or owner roles can sync payments' : undefined}
                        >
                          {syncingStripeInvoiceId === invoice.id ? 'Syncing…' : 'Sync to Stripe'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 text-neutral-600 text-xs">
                      {invoice.quickbooksInvoiceId ? (
                        <span className="text-green-700">{invoice.quickbooksInvoiceId}</span>
                      ) : (
                        <button
                          onClick={() => handleSyncQuickBooks(invoice.id)}
                          disabled={!canManageFinancials || !!syncingQboInvoiceId}
                          className="text-[#143352] underline disabled:opacity-50"
                          title={!canManageFinancials ? 'Only finance or owner roles can sync payments' : undefined}
                        >
                          {syncingQboInvoiceId === invoice.id ? 'Syncing…' : 'Sync to QBO'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleViewAuditLog(invoice.id)}
                        className="text-sm text-neutral-600 underline"
                      >
                        View Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!canManageFinancials && <p className="text-xs text-neutral-500 mt-2">Only Owner or Finance roles can sync invoices.</p>}
          </div>
        )}
        {selectedInvoiceAudit.length > 0 && (
          <div className="border border-neutral-200 p-3 bg-neutral-50">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">Audit log – {selectedInvoiceId}</p>
            <ul className="space-y-2 text-sm text-neutral-700 max-h-48 overflow-y-auto">
              {selectedInvoiceAudit.map((entry) => (
                <li key={entry.id} className="border border-neutral-200 bg-white p-2">
                  <p className="font-semibold text-neutral-900">{entry.action} <span className="text-xs text-neutral-500">{new Date(entry.createdAt).toLocaleString()}</span></p>
                  <p className="text-xs text-neutral-500">Actor: {entry.actorId}</p>
                  {entry.metadata && <pre className="text-[11px] bg-neutral-50 p-2 mt-1 overflow-x-auto">{JSON.stringify(entry.metadata, null, 2)}</pre>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <section className="bg-white border border-neutral-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-heading font-semibold text-neutral-900">AI Pricing Snapshots</p>
            <p className="text-sm text-neutral-500">Audit trail of cost + margin assumptions.</p>
          </div>
          <button
            onClick={handleGeneratePricingSnapshot}
            disabled={!canRunAIPricing}
            title={!canRunAIPricing ? 'Only Owner or Finance can run AI pricing' : undefined}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs border uppercase tracking-[0.2em] ${
              canRunAIPricing ? 'border-[#143352] text-[#143352]' : 'border-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            Run AI Pricing
          </button>
        </div>
        {aiPricingSnapshots.length === 0 ? (
          <p className="text-sm text-neutral-500">No pricing snapshots yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2 text-left">Version</th>
                  <th className="px-4 py-2 text-left">Contract Type</th>
                  <th className="px-4 py-2 text-left">Direct Cost</th>
                  <th className="px-4 py-2 text-left">Contingency</th>
                  <th className="px-4 py-2 text-left">Projected Margin</th>
                  <th className="px-4 py-2 text-left">Risk</th>
                </tr>
              </thead>
              <tbody>
                {aiPricingSnapshots.map((snapshot) => (
                  <tr key={snapshot.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2 font-medium text-neutral-900">{snapshot.pricingVersion}</td>
                    <td className="px-4 py-2">{snapshot.suggestedContractType}</td>
                    <td className="px-4 py-2">{formatCurrency(snapshot.directCost)}</td>
                    <td className="px-4 py-2">{formatCurrency(snapshot.contingency)}</td>
                    <td className="px-4 py-2">{(snapshot.projectedMargin * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2">{snapshot.riskScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );

  const contractsContent = (
    <div className="space-y-6">
      <section className="bg-white border border-neutral-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-heading font-semibold text-neutral-900">Contracts & Billing</p>
            <p className="text-sm text-neutral-500">Track structure, approvals, and AI guidance.</p>
          </div>
          <button
            onClick={handleGenerateRecommendation}
            disabled={!canRunAIRecommendations}
            title={!canRunAIRecommendations ? 'Only PM, Owner, or Finance can run recommendations' : undefined}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs border uppercase tracking-[0.2em] ${
              canRunAIRecommendations ? 'border-[#143352] text-[#143352]' : 'border-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            Run AI Recommendation
          </button>
        </div>
        {contractSelector}
        {selectedContract ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
            <div className="border border-neutral-200 p-4">
              <p className="text-xs uppercase text-neutral-500">Contract Type</p>
              <p className="text-lg font-heading text-neutral-900">{selectedContract.contractType}</p>
              <p className="text-xs text-neutral-500 mt-1">Billing: {selectedContract.billingMethod}</p>
            </div>
            <div className="border border-neutral-200 p-4">
              <p className="text-xs uppercase text-neutral-500">Value / Fee</p>
              <p className="text-lg font-heading text-neutral-900">{selectedContract.contractValue ? formatCurrency(selectedContract.contractValue) : '—'}</p>
              {selectedContract.feePercentage && <p className="text-xs text-neutral-500 mt-1">Fee: {selectedContract.feePercentage}%</p>}
            </div>
            <div className="border border-neutral-200 p-4">
              <p className="text-xs uppercase text-neutral-500">Retainage</p>
              <p className="text-lg font-heading text-neutral-900">{selectedContract.retainagePercentage ? `${selectedContract.retainagePercentage}%` : 'None'}</p>
              <p className="text-xs text-neutral-500 mt-1">Status: {selectedContract.status}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Select or create a contract to begin.</p>
        )}
      </section>
      <section className="bg-white border border-neutral-200 p-5 space-y-3">
        <div>
          <p className="text-lg font-heading font-semibold text-neutral-900">AI Recommendations</p>
          <p className="text-sm text-neutral-500">Every run is logged with rationale and risk.</p>
        </div>
        {aiRecommendations.length === 0 ? (
          <p className="text-sm text-neutral-500">No AI recommendations generated yet.</p>
        ) : (
          <div className="space-y-3">
            {aiRecommendations.map((rec) => (
              <div key={rec.id} className="border border-neutral-200 p-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-neutral-900">{rec.suggestedContract} • {rec.suggestedBilling}</p>
                    <p className="text-xs text-neutral-500">Risk {rec.riskScore} • Confidence {(rec.confidenceScore * 100).toFixed(0)}%</p>
                  </div>
                  <p className="text-xs text-neutral-500">{new Date(rec.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-neutral-600 mt-2">{rec.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const milestonesContent = (
    <div className="space-y-6">
      <section className="bg-white border border-neutral-200 p-5 space-y-4">
        {contractSelector}
        {milestones.length === 0 ? (
          <p className="text-sm text-neutral-500">No milestones configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2 text-left">Milestone</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Scheduled</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((milestone) => (
                  <tr key={milestone.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2 font-medium text-neutral-900">{milestone.name}</td>
                    <td className="px-4 py-2">{formatCurrency(milestone.amount)}</td>
                    <td className="px-4 py-2">{milestone.scheduledDate || 'TBD'}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 text-xs border border-neutral-200">{milestone.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="bg-white border border-neutral-200 p-5 space-y-3">
        <p className="text-lg font-heading font-semibold text-neutral-900">Schedule of Values</p>
        {scheduleOfValues.length === 0 ? (
          <p className="text-sm text-neutral-500">No schedule of values entries.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2 text-left">Line Item</th>
                  <th className="px-4 py-2 text-left">Budget</th>
                  <th className="px-4 py-2 text-left">% Complete</th>
                  <th className="px-4 py-2 text-left">Earned</th>
                  <th className="px-4 py-2 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {scheduleOfValues.map((entry) => (
                  <tr key={entry.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2 font-medium text-neutral-900">{entry.lineItem}</td>
                    <td className="px-4 py-2">{formatCurrency(entry.budgetAmount)}</td>
                    <td className="px-4 py-2">{entry.percentComplete}%</td>
                    <td className="px-4 py-2">{formatCurrency(entry.amountEarned)}</td>
                    <td className="px-4 py-2 text-neutral-500">{new Date(entry.lastUpdated).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );

  const filteredLedgerEntries = selectedContractId ? ledgerEntries.filter((entry) => entry.contractId === selectedContractId) : ledgerEntries;

  const ledgerContent = (
    <div className="space-y-6">
      <section className="bg-white border border-neutral-200 p-5 space-y-4">
        {contractSelector}
        {filteredLedgerEntries.length === 0 ? (
          <p className="text-sm text-neutral-500">No ledger entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Committed</th>
                  <th className="px-4 py-2 text-left">Actual</th>
                  <th className="px-4 py-2 text-left">Recorded</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedgerEntries.map((entry) => (
                  <tr key={entry.id} className="border-t border-neutral-100">
                    <td className="px-4 py-2 font-medium text-neutral-900">{entry.category}</td>
                    <td className="px-4 py-2 text-neutral-700">{entry.description}</td>
                    <td className="px-4 py-2">{entry.committedAmount ? formatCurrency(entry.committedAmount) : '—'}</td>
                    <td className="px-4 py-2">{entry.actualAmount ? formatCurrency(entry.actualAmount) : '—'}</td>
                    <td className="px-4 py-2 text-neutral-500">{new Date(entry.recordedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="bg-white border border-neutral-200 p-5">
        <p className="text-lg font-heading font-semibold text-neutral-900 mb-4">Record Cost</p>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAddLedgerEntry}>
          <fieldset disabled={!canManageFinancials} className="contents">
            <select value={ledgerForm.contractId} onChange={(e) => setLedgerForm({ ...ledgerForm, contractId: e.target.value })} className="border border-neutral-300 px-3 py-2" required>
              <option value="">Select contract...</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.contractType} • {contract.billingMethod}
                </option>
              ))}
            </select>
            <select value={ledgerForm.category} onChange={(e) => setLedgerForm({ ...ledgerForm, category: e.target.value as CostLedgerCategory })} className="border border-neutral-300 px-3 py-2">
              {['Labor', 'Material', 'Subcontractor', 'Equipment', 'Permit', 'Contingency'].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input value={ledgerForm.description} onChange={(e) => setLedgerForm({ ...ledgerForm, description: e.target.value })} required placeholder="Description" className="border border-neutral-300 px-3 py-2 md:col-span-2" />
            <input type="number" value={ledgerForm.committedAmount ?? ''} onChange={(e) => setLedgerForm({ ...ledgerForm, committedAmount: e.target.value ? Number(e.target.value) : undefined })} placeholder="Committed Amount" className="border border-neutral-300 px-3 py-2" />
            <input type="number" value={ledgerForm.actualAmount ?? ''} onChange={(e) => setLedgerForm({ ...ledgerForm, actualAmount: e.target.value ? Number(e.target.value) : undefined })} placeholder="Actual Amount" className="border border-neutral-300 px-3 py-2" />
            <input value={ledgerForm.vendorId || ''} onChange={(e) => setLedgerForm({ ...ledgerForm, vendorId: e.target.value })} placeholder="Vendor / PO" className="border border-neutral-300 px-3 py-2" />
            <div className="md:col-span-2 flex items-center justify-end">
              <button type="submit" className="px-4 py-2 bg-[#143352] text-white text-sm" disabled={!canManageFinancials}>
                Record Cost
              </button>
            </div>
          </fieldset>
        </form>
        {!canManageFinancials && <p className="text-xs text-neutral-500 mt-2">Only Owner or Finance roles can record ledger entries.</p>}
      </section>
    </div>
  );

  const permitsContent = (
    <div className="space-y-6">
      <section className="bg-white border border-neutral-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-heading font-semibold text-neutral-900">Permit Register</p>
            <p className="text-sm text-neutral-500">Track jurisdiction, reviewer, and inspection blockers.</p>
          </div>
        </div>
        {permits.length === 0 ? (
          <p className="text-sm text-neutral-500">No permits logged. Toggle "Permits needed" to begin.</p>
        ) : (
          <div className="space-y-3">
            {permits.map((permit) => (
              <div key={permit.id} className="border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900">{permit.permitType} • {permit.jurisdictionName}</p>
                    <p className="text-xs text-neutral-500">Authority: {permit.reviewerAuthority} • Status: {permit.status}</p>
                    {permit.codeSet && <p className="text-xs text-neutral-500">Code: {permit.codeSet} {permit.codeVersion}</p>}
                    {permit.reviewerContact && <p className="text-xs text-neutral-500">Reviewer: {permit.reviewerContact}</p>}
                    {permit.notes && <p className="text-xs text-neutral-500">Notes: {permit.notes}</p>}
                  </div>
                  <div className="text-xs text-neutral-500 text-right">
                    {permit.submissionDate && <p>Submitted: {permit.submissionDate}</p>}
                    {permit.approvalDate && <p>Approved: {permit.approvalDate}</p>}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-1">Inspections</p>
                  {inspectionsByPermit[permit.id]?.length ? (
                    <ul className="text-sm text-neutral-700 space-y-1">
                      {inspectionsByPermit[permit.id].map((inspection) => (
                        <li key={inspection.id} className="border border-neutral-200 px-2 py-1">
                          {inspection.inspectionType} • {inspection.result || 'Scheduled'} {inspection.scheduledAt && `(${new Date(inspection.scheduledAt).toLocaleDateString()})`}
                          {inspection.inspectorNotes && <p className="text-xs text-neutral-500">{inspection.inspectorNotes}</p>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-neutral-500">No inspections logged.</p>) }
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="bg-white border border-neutral-200 p-5 space-y-3">
        <p className="text-lg font-heading font-semibold text-neutral-900">Add Permit Record</p>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAddPermit}>
          <input value={permitForm.jurisdictionName} onChange={(e) => setPermitForm({ ...permitForm, jurisdictionName: e.target.value })} placeholder="Jurisdiction (e.g., St. John Parish)" className="border border-neutral-300 px-3 py-2" required />
          <select value={permitForm.jurisdictionType} onChange={(e) => setPermitForm({ ...permitForm, jurisdictionType: e.target.value as PermitRecord['jurisdictionType'] })} className="border border-neutral-300 px-3 py-2">
            {['Parish', 'City', 'State', 'Federal'].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select value={permitForm.permitType} onChange={(e) => setPermitForm({ ...permitForm, permitType: e.target.value as PermitRecord['permitType'] })} className="border border-neutral-300 px-3 py-2">
            {permitTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select value={permitForm.codeSet} onChange={(e) => setPermitForm({ ...permitForm, codeSet: e.target.value as PermitRecord['codeSet'] })} className="border border-neutral-300 px-3 py-2">
            {['IBC', 'IRC', 'IEBC', 'NFPA', 'Other'].map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <input value={permitForm.codeVersion} onChange={(e) => setPermitForm({ ...permitForm, codeVersion: e.target.value })} placeholder="Code Version (e.g., 2021)" className="border border-neutral-300 px-3 py-2" />
          <select value={permitForm.reviewerAuthority} onChange={(e) => setPermitForm({ ...permitForm, reviewerAuthority: e.target.value as PermitRecord['reviewerAuthority'] })} className="border border-neutral-300 px-3 py-2">
            {['LocalAHJ', 'OSFM', 'ThirdParty', 'Client'].map((authority) => (
              <option key={authority} value={authority}>{authority}</option>
            ))}
          </select>
          <input value={permitForm.reviewerContact} onChange={(e) => setPermitForm({ ...permitForm, reviewerContact: e.target.value })} placeholder="Reviewer contact" className="border border-neutral-300 px-3 py-2 md:col-span-2" />
          <select value={permitForm.status} onChange={(e) => setPermitForm({ ...permitForm, status: e.target.value as PermitRecord['status'] })} className="border border-neutral-300 px-3 py-2">
            {permitStatusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <textarea value={permitForm.notes} onChange={(e) => setPermitForm({ ...permitForm, notes: e.target.value })} placeholder="Notes" className="border border-neutral-300 px-3 py-2 md:col-span-2" rows={3} />
          <div className="md:col-span-2 flex items-center justify-end">
            <button type="submit" className="px-4 py-2 bg-[#143352] text-white text-sm">Save Permit</button>
          </div>
        </form>
      </section>
      <section className="bg-white border border-neutral-200 p-5 space-y-3">
        <p className="text-lg font-heading font-semibold text-neutral-900">Log Inspection</p>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleAddInspection}>
          <select value={inspectionForm.permitId} onChange={(e) => setInspectionForm({ ...inspectionForm, permitId: e.target.value })} className="border border-neutral-300 px-3 py-2" required>
            <option value="">Select permit...</option>
            {permits.map((permit) => (
              <option key={permit.id} value={permit.id}>{permit.permitType} • {permit.jurisdictionName}</option>
            ))}
          </select>
          <select value={inspectionForm.inspectionType} onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionType: e.target.value as PermitInspection['inspectionType'] })} className="border border-neutral-300 px-3 py-2">
            {['Rough', 'Framing', 'Final', 'Electrical', 'Mechanical', 'Plumbing', 'Fire', 'Other'].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input type="date" value={inspectionForm.scheduledAt} onChange={(e) => setInspectionForm({ ...inspectionForm, scheduledAt: e.target.value })} className="border border-neutral-300 px-3 py-2" />
          <div className="md:col-span-3 flex items-center justify-end">
            <button type="submit" className="px-4 py-2 bg-[#143352] text-white text-sm">Log Inspection</button>
          </div>
        </form>
      </section>
    </div>
  );

  const historicContent = (
    <div className="space-y-6">
      <section className="bg-white border border-neutral-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-heading font-semibold text-neutral-900">Historic Evidence</p>
            <p className="text-sm text-neutral-500">Evidence gates per Secretary of the Interior standards.</p>
          </div>
          <span className={`text-xs px-2 py-1 border ${isHistoricProject ? 'border-emerald-200 text-emerald-700' : 'border-neutral-200 text-neutral-500'}`}>
            {isHistoricProject ? 'Historic Mode Active' : 'Historic Mode Off'}
          </span>
        </div>
        {historicArtifacts.length === 0 ? (
          <p className="text-sm text-neutral-500">No artifacts recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {historicArtifacts.map((artifact) => (
              <div key={artifact.id} className="border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-neutral-900">{artifact.artifactType}</p>
                  <span className="text-xs text-neutral-500">{artifact.reviewStatus}</span>
                </div>
                <p className="text-sm text-neutral-600 mt-1">{artifact.description}</p>
                {artifact.evidenceUrls.length > 0 && (
                  <ul className="text-xs text-neutral-500 list-disc list-inside mt-2">
                    {artifact.evidenceUrls.map((url) => (
                      <li key={url}>{url}</li>
                    ))}
                  </ul>
                )}
                {artifact.reviewerNotes && <p className="text-xs text-neutral-500 mt-1">Reviewer Notes: {artifact.reviewerNotes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="bg-white border border-neutral-200 p-5 space-y-3">
        <p className="text-lg font-heading font-semibold text-neutral-900">Add Evidence Artifact</p>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAddHistoricArtifact}>
          <select value={historicForm.artifactType} onChange={(e) => setHistoricForm({ ...historicForm, artifactType: e.target.value as HistoricArtifact['artifactType'] })} className="border border-neutral-300 px-3 py-2">
            {historicTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <textarea value={historicForm.description} onChange={(e) => setHistoricForm({ ...historicForm, description: e.target.value })} placeholder="Describe artifact (materials, method, justification)" className="border border-neutral-300 px-3 py-2 md:col-span-2" rows={3} required />
          <textarea value={historicForm.evidenceUrls} onChange={(e) => setHistoricForm({ ...historicForm, evidenceUrls: e.target.value })} placeholder="Evidence URLs (comma or newline separated)" className="border border-neutral-300 px-3 py-2 md:col-span-2" rows={2} />
          <div className="md:col-span-2 flex items-center justify-end">
            <button type="submit" className="px-4 py-2 bg-[#143352] text-white text-sm">Save Artifact</button>
          </div>
        </form>
        {!isHistoricProject && <p className="text-xs text-neutral-500">Historic mode currently off for this project.</p>}
      </section>
    </div>
  );

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/projects')} className="inline-flex items-center gap-2 text-[#143352]">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      <section className="bg-white border border-neutral-200 p-6 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-neutral-500">{campus?.name} • {site?.name}</p>
            <h1 className="text-3xl font-heading font-bold text-neutral-900">{project.name}</h1>
            <p className="text-sm text-neutral-600">{project.clientSummary}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs bg-neutral-100 text-neutral-700">{project.status}</span>
            <button
              onClick={async () => {
                const token = await projectService.generateClientLink(project.id);
                if (token) {
                  await navigator.clipboard.writeText(`${window.location.origin}/client/projects/${project.id}/${token}`);
                  toast.success('Client link copied');
                }
              }}
              className="text-sm text-neutral-600 inline-flex items-center gap-1"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button
              onClick={handleGenerateAiEstimate}
              disabled={creatingEstimate}
              className={`text-sm inline-flex items-center gap-2 px-4 py-2 border ${creatingEstimate ? 'border-neutral-200 text-neutral-400' : 'border-[#143352] text-[#143352]'}`}
            >
              {creatingEstimate ? 'Creating…' : 'Create Estimate'}
            </button>
          </div>
        </div>
        {lastEstimateResult && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded">
            Draft saved to work order {lastEstimateResult.workRequestId} for {formatCurrency(lastEstimateResult.total)}.
          </div>
        )}
        <div className="flex flex-wrap gap-6 text-sm text-neutral-600">
          <span>Owner: {owner?.name || 'Unassigned'}</span>
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {project.startDate} – {project.endDate}</span>
          <span>Value: {formatCurrency(project.totalBudget)}</span>
        </div>
      </section>

      <div className="border-b border-neutral-200 flex gap-4">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'board', label: 'Task Board' },
          { id: 'plan', label: 'Plan & Files' },
          { id: 'financials', label: 'Financials' },
          { id: 'contracts', label: 'Contracts' },
          { id: 'milestones', label: 'Milestones' },
          { id: 'ledger', label: 'Cost Ledger' },
          { id: 'permits', label: 'Permits' },
          { id: 'historic', label: 'Historic' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`pb-2 text-sm font-medium ${activeTab === tab.id ? 'text-[#143352] border-b-2 border-[#143352]' : 'text-neutral-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && overviewContent}
      {activeTab === 'board' && boardContent}
      {activeTab === 'plan' && planContent}
      {activeTab === 'financials' && financialsContent}
      {activeTab === 'contracts' && contractsContent}
      {activeTab === 'milestones' && milestonesContent}
      {activeTab === 'ledger' && ledgerContent}
      {activeTab === 'permits' && permitsContent}
      {activeTab === 'historic' && historicContent}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl border border-neutral-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-semibold text-neutral-900">New Task</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-neutral-500">Close</button>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAddTask}>
              <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required placeholder="Task title" className="border border-neutral-300 px-3 py-2" />
              <select value={taskTemplate} onChange={(e) => setTaskTemplate(e.target.value as TaskTemplate)} className="border border-neutral-300 px-3 py-2">
                <option value="default">General</option>
                <option value="historicRestoration">Historic Restoration</option>
                <option value="eventSetup">Event Setup</option>
                <option value="lightingUpgrade">Lighting Upgrade</option>
                <option value="hvacRepair">HVAC Repair</option>
              </select>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Describe scope (list measurements, constraints, stakeholders)"
                className="border border-neutral-300 px-3 py-2 md:col-span-2"
                rows={3}
              />
              <input value={taskForm.locationDetail} onChange={(e) => setTaskForm({ ...taskForm, locationDetail: e.target.value })} placeholder="Location / room" className="border border-neutral-300 px-3 py-2" />
              <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as WorkOrder['priority'] })} className="border border-neutral-300 px-3 py-2">
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              {aiSuggestions && (
                <div className="md:col-span-2 bg-neutral-50 border border-neutral-200 p-4 text-sm text-neutral-600 space-y-2">
                  <p className="font-medium text-neutral-900">Suggested discovery questions</p>
                  <ul className="list-disc list-inside space-y-1">
                    {aiSuggestions.questions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ul>
                  <p>Materials: {aiSuggestions.materials}</p>
                  <p>Labor: {aiSuggestions.labor}</p>
                </div>
              )}
              <div className="md:col-span-2 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 border border-neutral-300 text-neutral-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#143352] text-white">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
