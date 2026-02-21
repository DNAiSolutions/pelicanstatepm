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
import { LEAD_NEXT_STEP_LABELS, type Lead, type LeadStage } from '../types';
import { useNavigate } from 'react-router-dom';
import { useProfileData } from '../hooks/useProfileData';
import { Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { LeadIntakeModal } from '../components/leads/LeadIntakeModal';
import { LeadDetailDrawer } from '../components/leads/LeadDetailDrawer';

const LEAD_STAGE_COLUMNS: LeadStage[] = ['New', 'Qualified', 'Walkthrough', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export function LeadsPage() {
  const { isAdminProfile, properties } = useProfileData();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | ''>('');
  const [propertyFilter, setPropertyFilter] = useState('');
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
    property_id: properties[0]?.id || '',
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } })
  );

  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true);
        const data = await leadService.list();
        setLeads(data);
      } catch (err) {
        console.error('List leads error:', err);
        toast.error('Failed to load leads');
      } finally {
        setLoading(false);
      }
    };
    loadLeads();
  }, [isAdminProfile]);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.company_name.toLowerCase().includes(search.toLowerCase()) ||
        lead.contact_name.toLowerCase().includes(search.toLowerCase());
      const matchesStage = !stageFilter || lead.stage === stageFilter;
      const matchesProperty = !propertyFilter || lead.property_id === propertyFilter;
      return matchesSearch && matchesStage && matchesProperty;
    });
  }, [leads, search, stageFilter, propertyFilter]);

  const activeLead = useMemo(() => filtered.find((lead) => lead.id === activeLeadId) || null, [activeLeadId, filtered]);

  const handleCreate = async () => {
    try {
      setLoading(true);
      const lead = await leadService.create({
        company_name: form.companyName,
        contact_name: form.contactName,
        email: form.email,
        phone: form.phone,
        estimated_value: form.estimatedValue,
        property_id: form.property_id,
        stage: 'New',
        source: 'Inbound',
        notes: 'Created from leads page',
      });
      setLeads((prev) => [...prev, lead]);
      setShowIntakeModal(false); // Assuming setShowCreateModal refers to setShowIntakeModal
      setForm({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        estimatedValue: 25000,
        property_id: '',
      });
      toast.success('Lead created');
      } catch (err) {
        console.error('Create lead error:', err);
        toast.error('Create failed');
      } finally {
        setLoading(false);
      }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await leadService.delete(leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setSelectedLead(null);
      toast.success('Lead deleted');
    } catch (err) {
      console.error('Delete lead error:', err);
      toast.error('Delete failed');
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
        <div className="w-10 h-10 border-4 border-[#0f2749]/20 border-t-[#0f2749] rounded-full animate-spin" />
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
            className="inline-flex items-center gap-2 bg-[#0f2749] text-white px-4 py-2.5 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </header>

      <section className="bg-white border border-neutral-200 p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-neutral-600 text-sm">
          <Filter className="w-4 h-4" /> Filter by stage or property
        </div>
        <div className="flex flex-col gap-3 w-full lg:w-auto lg:flex-row">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads"
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#0f2749]"
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
          <select value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)} className="px-3 py-2 border border-neutral-300">
            <option value="">All Properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
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
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Company" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Contact" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border border-neutral-300 px-3 py-2" />
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="border border-neutral-300 px-3 py-2" />
          <input type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) })} placeholder="Value" className="border border-neutral-300 px-3 py-2" />
          <select value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })} className="border border-neutral-300 px-3 py-2">
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          <button type="submit" className="bg-[#0f2749] text-white px-4 py-2 font-medium flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Save Lead
          </button>
        </form>
      </section>

      {showIntakeModal && (
        <LeadIntakeModal
          open={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          onCreated={(lead) => setLeads((prev) => [...prev, lead])}
          onLeadUpdated={(lead) => {
            setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)));
            setSelectedLead(lead); // Update selected lead if it's the one being edited
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
          onLeadUpdated={(updatedLead) => {
            setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
            setSelectedLead(updatedLead); // Keep the drawer updated with the latest lead data
          }}
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
        isOver ? 'shadow-lg ring-2 ring-[#0f2749]/30' : ''
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
      className={`border border-neutral-200 bg-white p-3 space-y-2 text-left w-full hover:border-[#0f2749]/40 focus:outline-none focus:ring-2 focus:ring-[#0f2749]/40 cursor-grab ${
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
  const recommendedLabel = lead.recommended_next_step ? LEAD_NEXT_STEP_LABELS[lead.recommended_next_step] || lead.recommended_next_step : null;
  return (
    <>
      <div>
        <p className="font-medium text-neutral-900 truncate">{lead.company_name}</p>
        <p className="text-xs text-neutral-500 truncate">{lead.contact_name}</p>
      </div>
      {lead.intake_channel && (
        <span className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] bg-neutral-100 text-neutral-500 px-2 py-0.5">
          {lead.intake_channel}
        </span>
      )}
      <p className="text-xs text-neutral-500">Value {formatCurrency(lead.estimated_value)}</p>
      <p className="text-xs text-neutral-500">Recommended: {recommendedLabel || lead.next_step || 'TBD'}</p>
      {lead.project_id && onNavigateProject ? (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onNavigateProject(lead.project_id!);
          }}
          className="text-xs text-[#0f2749]"
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
