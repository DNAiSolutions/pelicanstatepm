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
} from '../data/pipeline';
import { projectService } from '../services/projectService';
import { leadService } from '../services/leadService';
import { contactService } from '../services/contactService';
import { projectTaskService, type TaskTemplate } from '../services/projectTaskService';
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

type Tab = 'overview' | 'board' | 'list' | 'plan';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

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
        setProject(proj);
        setLeads(projLeads);
        setContacts(projContacts);
        setTasks(projTasks);
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

  const site = useMemo(() => mockSites.find((s) => s.id === project?.siteId), [project]);
  const campus = useMemo(() => mockCampuses.find((c) => c.id === project?.campusId), [project]);
  const owner = useMemo(() => mockUsers.find((u) => u.id === project?.internalOwnerId), [project]);

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

  const listContent = (
    <div className="bg-white border border-neutral-200">
      <div className="px-5 py-3 border-b border-neutral-200 flex items-center justify-between">
        <p className="text-sm text-neutral-600">Detailed task table showing estimates.</p>
        <button onClick={() => setShowTaskModal(true)} className="text-xs text-[#143352]">Add Task</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Priority</th>
              <th className="px-6 py-3 text-left">Materials</th>
              <th className="px-6 py-3 text-left">Labor</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-t border-neutral-100">
                <td className="px-6 py-3 font-medium text-neutral-900">{task.title}</td>
                <td className="px-6 py-3 text-neutral-600">{task.status}</td>
                <td className="px-6 py-3 text-neutral-600">{task.priority}</td>
                <td className="px-6 py-3 text-neutral-600">{task.aiMaterialSummary || '—'}</td>
                <td className="px-6 py-3 text-neutral-600">{task.aiLaborSummary || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
          </div>
        </div>
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
          { id: 'list', label: 'Task List' },
          { id: 'plan', label: 'Construction Plan & Layers' },
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
      {activeTab === 'list' && listContent}
      {activeTab === 'plan' && planContent}

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
