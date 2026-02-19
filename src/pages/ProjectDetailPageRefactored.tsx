import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  type Contact,
  type Lead,
  type Project,
  type WorkOrder,
} from '../data/pipeline';
import { projectService } from '../services/projectService';
import { projectTaskService } from '../services/projectTaskService';
import toast from 'react-hot-toast';

// Import new components
import {
  ProjectDetailHeader,
  ProjectFinancials,
  ProjectTasks,
  ProjectLeads,
  ProjectContacts,
  type Tab,
} from '../components/ProjectDetail';

export function ProjectDetailPageRefactored() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // Core state
  const [project, setProject] = useState<Project | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Load project data on mount
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        const proj = await projectService.getProject(projectId);
        if (proj) {
          setProject(proj);
        }

        const projLeads = await projectService.getProjectLeads(projectId);
        setLeads(projLeads);

        const projContacts = await projectService.getProjectContacts(projectId);
        setContacts(projContacts);

        const projTasks = projectTaskService.getByProject(projectId);
        setTasks(projTasks);
      } catch (error) {
        console.error('Error loading project:', error);
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId]);

  // Handlers
  const handleAddTask = () => {
    toast.success('Add task modal coming soon');
  };

  const handleAddLead = () => {
    // TODO: Open lead modal
    toast.success('Lead modal coming soon');
  };

  const handleAddContact = () => {
    // TODO: Open contact modal
    toast.success('Contact modal coming soon');
  };

  const handleTaskClick = (task: WorkOrder) => {
    // TODO: Navigate to task detail or open modal
    toast.success(`Clicked task: ${task.title}`);
  };

  const handleLeadClick = (lead: Lead) => {
    // TODO: Navigate to lead detail or open modal
    toast.success(`Clicked lead: ${lead.companyName}`);
  };

  const handleContactClick = (contact: Contact) => {
    // TODO: Navigate to contact detail or open modal
    toast.success(`Clicked contact: ${contact.name}`);
  };

  const handleGoBack = () => {
    navigate('/projects');
  };

  // Loading state
  if (loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#143352]/20 border-t-[#143352] rounded-full animate-spin" />
      </div>
    );
  }

  // Render
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <ProjectDetailHeader
          project={project}
          onGoBack={handleGoBack}
        />

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-neutral-200">
          <div className="flex gap-8 overflow-x-auto">
            {(['overview', 'plan', 'financials', 'contracts', 'permits', 'historic'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-[#143352] text-[#143352]'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ProjectFinancials project={project} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProjectLeads
                leads={leads}
                onAddLead={handleAddLead}
                onLeadClick={handleLeadClick}
              />
              <ProjectContacts
                contacts={contacts}
                onAddContact={handleAddContact}
                onContactClick={handleContactClick}
              />
            </div>

            <ProjectTasks
              tasks={tasks}
              onAddTask={handleAddTask}
              onTaskClick={handleTaskClick}
            />
          </div>
        )}

        {activeTab === 'plan' && (
          <ProjectTasks
            tasks={tasks}
            onAddTask={handleAddTask}
            onTaskClick={handleTaskClick}
          />
        )}

        {activeTab === 'financials' && (
          <ProjectFinancials project={project} />
        )}

        {['contracts', 'permits', 'historic'].includes(activeTab) && (
          <div className="bg-white border border-neutral-200 p-8 rounded-lg">
            <div className="text-center">
              <p className="text-lg font-semibold text-neutral-900 mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </p>
              <p className="text-neutral-500">This tab is coming soon in the next refactoring phase.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
