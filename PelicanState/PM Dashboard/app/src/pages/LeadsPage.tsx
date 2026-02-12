import { useEffect, useMemo, useState } from 'react';
import { leadService } from '../services/leadService';
import { mockCampuses, type Lead, type LeadStage } from '../data/pipeline';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | ''>('');
  const [campusFilter, setCampusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    estimatedValue: 15000,
    campusId: mockCampuses[0]?.id || '',
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await leadService.list();
        setLeads(data);
      } catch (error) {
        toast.error('Failed to load leads');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
        <button
          onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}
          className="inline-flex items-center gap-2 bg-[#143352] text-white px-4 py-2.5 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </button>
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
            {['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'].map((stage) => (
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

      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'].map((stage) => (
          <div key={stage} className="bg-white border border-neutral-200 p-4 space-y-3 min-h-[360px] flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">{stage}</p>
              <span className="text-xs text-neutral-500">{filtered.filter((lead) => lead.stage === stage).length}</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {filtered.filter((lead) => lead.stage === stage).map((lead) => (
                <div key={lead.id} className="border border-neutral-200 p-3 space-y-2">
                  <div>
                    <p className="font-medium text-neutral-900 truncate">{lead.companyName}</p>
                    <p className="text-xs text-neutral-500 truncate">{lead.contactName}</p>
                  </div>
                  <p className="text-xs text-neutral-500">Value {formatCurrency(lead.estimatedValue)}</p>
                  <p className="text-xs text-neutral-500">Next: {lead.nextStep || 'TBD'}</p>
                  {lead.projectId ? (
                    <button onClick={() => navigate(`/projects/${lead.projectId}`)} className="text-xs text-[#143352]">
                      Project
                    </button>
                  ) : null}
                </div>
              ))}
              {filtered.filter((lead) => lead.stage === stage).length === 0 && (
                <p className="text-xs text-neutral-500">No leads</p>
              )}
            </div>
          </div>
        ))}
      </section>

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
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
