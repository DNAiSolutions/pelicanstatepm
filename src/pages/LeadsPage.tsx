import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { leadService } from '../services/leadService';
import { mockCampuses, LEAD_NEXT_STEP_LABELS, type Lead, type LeadStage } from '../data/pipeline';
import { useNavigate } from 'react-router-dom';
import { useProfileData } from '../hooks/useProfileData';
import { Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { LeadIntakeModal } from '../components/leads/LeadIntakeModal';
import { LeadDetailDrawer } from '../components/leads/LeadDetailDrawer';

const LEAD_STAGE_COLUMNS: LeadStage[] = ['New', 'Qualified', 'Walkthrough', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export function LeadsPage() {
  const { isAdminProfile, campuses } = useProfileData();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | ''>('');
  const [campusFilter, setCampusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    estimatedValue: 15000,
    campusId: campuses[0]?.id || '',
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } })
  );

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Admin profile: always empty, no mock data
        if (isAdminProfile) {
          setLeads([]);
          return;
        }
        const data = await leadService.list();
        setLeads(data);
      } catch (error) {
        toast.error('Failed to load leads');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdminProfile]);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.companyName.toLowerCase().includes(search.toLowerCase()) ||
        lead.contactName.toLowerCase().includes(search.toLowerCase());
      const matchesStage = !stageFilter || lead.stage === stageFilter;
      const matchesCampus = !campusFilter || lead.campusId === campusFilter;
      return matchesSearch && matchesStage && matchesCampus;
    });
  }, [leads, search, stageFilter, campusFilter]);

  const activeLead = useMemo(() => filtered.find((lead) => lead.id === activeLeadId) || null, [activeLeadId, filtered]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lead = await leadService.create({
        ...form,
        stage: 'New',
        source: 'Inbound',
        notes: 'Created from leads page',
        projectId: undefined,
        contactIds: [],
      });
      setLeads((prev) => [...prev, lead]);
      setForm({ companyName: '', contactName: '', email: '', phone: '', estimatedValue: 15000, campusId: mockCampuses[0]?.id || '' });
      toast.success('Lead created');
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const confirmation = window.confirm('Delete this lead? This cannot be undone.');
    if (!confirmation) return;
    try {
      await leadService.delete(leadId);
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      toast.success('Lead deleted');
      setDrawerOpen(false);
      setSelectedLead(null);
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLeadId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLeadId(null);
    if (!over) return;

    const activeId = active.id as string;
    const movingLead = leads.find((lead) => lead.id === activeId);
    if (!movingLead) return;

    const destinationStage =
      (over.data.current?.stage as LeadStage | undefined) ||
      (LEAD_STAGE_COLUMNS.includes(over.id as LeadStage) ? (over.id as LeadStage) : undefined);

    if (!destinationStage || movingLead.stage === destinationStage) {
      return;
    }

    setLeads((prev) => prev.map((lead) => (lead.id === activeId ? { ...lead, stage: destinationStage } : lead)));

    try {
      await leadService.update(activeId, { stage: destinationStage });
      toast.success(`Moved to ${destinationStage}`);
    } catch (error) {
      toast.error('Failed to update stage');
      setLeads((prev) => prev.map((lead) => (lead.id === activeId ? movingLead : lead)));
    }
  };

  const handleDragCancel = () => {
    setActiveLeadId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#143352]/20 border-t-[#143352] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Pipeline</p>
          <h1 className="text-3xl font-heading font-bold text-neutral-900">Leads</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowIntakeModal(true)}
            className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-600 px-4 py-2.5 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Intake Form
          </button>
          <button
            onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-[#143352] text-white px-4 py-2.5 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </header>

      <section className="bg-white border border-neutral-200 p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-neutral-600 text-sm">
          <Filter className="w-4 h-4" /> Filter by stage or campus
        </div>
        <div className="flex flex-col gap-3 w-full lg:w-auto lg:flex-row">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads"
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#143352]"
            />
          </div>
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as LeadStage | '')} className="px-3 py-2 border border-neutral-300">
            <option value="">All Stages</option>
            {['New', 'Qualified', 'Walkthrough', 'Proposal', 'Negotiation', 'Won', 'Lost'].map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
          <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} className="px-3 py-2 border border-neutral-300">
            <option value="">All Campuses</option>
            {mockCampuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {LEAD_STAGE_COLUMNS.map((stage) => {
            const stageLeads = filtered.filter((lead) => lead.stage === stage);
            return (
              <StageColumn
                key={stage}
                stage={stage}
                leads={stageLeads}
                onSelectLead={(lead) => {
                  setSelectedLead(lead);
                  setDrawerOpen(true);
                }}
                onNavigateProject={(projectId) => navigate(`/projects/${projectId}`)}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeLead ? (
            <div className="border border-neutral-200 bg-white p-3 space-y-2 shadow-xl w-64">
              <LeadCardContent lead={activeLead} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <section id="lead-form" className="bg-white border border-neutral-200 p-6 space-y-4">
        <h2 className="text-lg font-heading font-semibold text-neutral-900">Create Lead</h2>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleCreate}>
          <input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Company" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Contact" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="border border-neutral-300 px-3 py-2" />
          <input type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) })} placeholder="Value" className="border border-neutral-300 px-3 py-2" />
          <select value={form.campusId} onChange={(e) => setForm({ ...form, campusId: e.target.value })} className="border border-neutral-300 px-3 py-2">
            {mockCampuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
          <button type="submit" className="bg-[#143352] text-white px-4 py-2 font-medium flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Save Lead
          </button>
        </form>
      </section>

      {showIntakeModal && (
        <LeadIntakeModal
          open={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          onCreated={(lead) => {
            setLeads((prev) => [...prev, lead]);
            setShowIntakeModal(false);
            toast.success('Lead captured');
          }}
          onLeadUpdated={(lead) => {
            setLeads((prev) => prev.map((item) => (item.id === lead.id ? lead : item)));
          }}
        />
      )}

      {drawerOpen && (
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedLead(null);
          }}
          onDelete={handleDeleteLead}
        />
      )}
    </div>
  );
}

interface StageColumnProps {
  stage: LeadStage;
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onNavigateProject: (projectId: string) => void;
}

function StageColumn({ stage, leads, onSelectLead, onNavigateProject }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, data: { stage } });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white border border-neutral-200 p-4 space-y-3 min-h-[360px] flex flex-col transition-shadow ${
        isOver ? 'shadow-lg ring-2 ring-[#143352]/30' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-900">{stage}</p>
        <span className="text-xs text-neutral-500">{leads.length}</span>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto">
        <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onSelectLead={onSelectLead} onNavigateProject={onNavigateProject} />
          ))}
        </SortableContext>
        {leads.length === 0 && <p className="text-xs text-neutral-500">No leads</p>}
      </div>
    </div>
  );
}

interface LeadCardProps {
  lead: Lead;
  onSelectLead: (lead: Lead) => void;
  onNavigateProject: (projectId: string) => void;
}

function LeadCard({ lead, onSelectLead, onNavigateProject }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { stage: lead.stage },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelectLead(lead)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectLead(lead);
        }
      }}
      className={`border border-neutral-200 bg-white p-3 space-y-2 text-left w-full hover:border-[#143352]/40 focus:outline-none focus:ring-2 focus:ring-[#143352]/40 cursor-grab ${
        isDragging ? 'opacity-50' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <LeadCardContent lead={lead} onNavigateProject={onNavigateProject} />
    </div>
  );
}

interface LeadCardContentProps {
  lead: Lead;
  onNavigateProject?: (projectId: string) => void;
}

function LeadCardContent({ lead, onNavigateProject }: LeadCardContentProps) {
  const recommendedLabel = lead.recommendedNextStep ? LEAD_NEXT_STEP_LABELS[lead.recommendedNextStep] || lead.recommendedNextStep : null;
  return (
    <>
      <div>
        <p className="font-medium text-neutral-900 truncate">{lead.companyName}</p>
        <p className="text-xs text-neutral-500 truncate">{lead.contactName}</p>
      </div>
      {lead.intakeChannel && (
        <span className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] bg-neutral-100 text-neutral-500 px-2 py-0.5">
          {lead.intakeChannel}
        </span>
      )}
      <p className="text-xs text-neutral-500">Value {formatCurrency(lead.estimatedValue)}</p>
      <p className="text-xs text-neutral-500">Recommended: {recommendedLabel || lead.nextStep || 'TBD'}</p>
      {lead.projectId && onNavigateProject ? (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onNavigateProject(lead.projectId!);
          }}
          className="text-xs text-[#143352]"
        >
          Project
        </button>
      ) : null}
    </>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
