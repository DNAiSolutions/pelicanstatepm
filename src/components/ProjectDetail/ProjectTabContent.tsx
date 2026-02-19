import { ProjectTasks } from './ProjectTasks';
import { ProjectFinancials } from './ProjectFinancials';
import type { Project, WorkOrder } from '../../data/pipeline';

export type Tab = 'overview' | 'board' | 'list' | 'plan' | 'financials' | 'contracts' | 'milestones' | 'ledger' | 'permits' | 'historic';

export interface ProjectTabContentProps {
  activeTab: Tab;
  project: Project;
  tasks: WorkOrder[];
  onAddTask?: () => void;
  onTaskClick?: (task: WorkOrder) => void;
}

export function ProjectTabContent({
  activeTab,
  project,
  tasks,
  onAddTask,
  onTaskClick,
}: ProjectTabContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ProjectFinancials project={project} />
        );
      case 'plan':
        return (
          <ProjectTasks
            tasks={tasks}
            onAddTask={onAddTask}
            onTaskClick={onTaskClick}
          />
        );
      case 'financials':
        return (
          <div className="space-y-6">
            <ProjectFinancials project={project} />
          </div>
        );
      case 'board':
      case 'list':
      case 'contracts':
      case 'milestones':
      case 'ledger':
      case 'permits':
      case 'historic':
      default:
        return (
          <div className="bg-white border border-neutral-200 p-8 rounded-lg">
            <div className="text-center">
              <p className="text-lg font-semibold text-neutral-900 mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab
              </p>
              <p className="text-neutral-500">Coming soon...</p>
            </div>
          </div>
        );
    }
  };

  return <div className="space-y-6">{renderContent()}</div>;
}
