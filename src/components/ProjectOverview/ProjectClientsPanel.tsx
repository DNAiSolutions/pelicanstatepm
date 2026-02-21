import { Plus, ChevronDown } from 'lucide-react';
import type { Project } from '../../types';
import { mockProperties } from '../../data/pipeline';

interface ProjectClientsPanelProps {
  groupedByClient: [string, Project[]][];
  expandedClients: Set<string>;
  onExpandedClientsChange: (expanded: Set<string>) => void;
  selectedProjectId: string;
  onProjectSelect: (projectId: string) => void;
  onNewProjectClick: () => void;
}

export function ProjectClientsPanel({
  groupedByClient,
  expandedClients,
  onExpandedClientsChange,
  selectedProjectId,
  onProjectSelect,
  onNewProjectClick,
}: ProjectClientsPanelProps) {
  const handleToggleClient = (clientName: string) => {
    const next = new Set(expandedClients);
    if (next.has(clientName)) {
      next.delete(clientName);
    } else {
      next.add(clientName);
    }
    onExpandedClientsChange(next);
  };

  return (
    <aside className="w-64 bg-white border border-neutral-200 p-4 space-y-4 hidden lg:block">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Clients</p>
        <button
          onClick={onNewProjectClick}
          className="text-sm text-[#0f2749] flex items-center gap-1"
        >
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
                onClick={() => handleToggleClient(clientName)}
                className="w-full flex items-center justify-between px-3 py-2 bg-neutral-50"
              >
                <div className="text-left">
                  <p className="text-xs font-semibold text-neutral-600 uppercase">
                    {clientName}
                  </p>
                  <p className="text-xs text-neutral-400">{clientProjects.length} projects</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-500 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isExpanded && (
                <div className="space-y-1 px-3 pb-2">
                  {clientProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => onProjectSelect(project.id)}
                      className={`w-full text-left px-2 py-1 border border-neutral-200 text-sm truncate ${
                        project.id === selectedProjectId
                          ? 'bg-[#0f2749] text-white'
                          : 'bg-white text-neutral-700'
                      }`}
                    >
                      {project.name}
                      <span className="block text-xs text-neutral-500">
                        {mockProperties.find((c) => c.id === project.property_id)?.name ||
                          'Property TBD'}
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
  );
}
