import { Phone, Mail, MapPin, Filter, ArrowRight } from 'lucide-react';
import type { Project } from '../../data/pipeline';
import { mockCampuses } from '../../data/pipeline';
import { projectTaskService } from '../../services/projectTaskService';

interface ProjectDetailsPanelProps {
  selectedProject: Project | undefined;
  selectedClientProjects: Project[];
  onProjectClick: (projectId: string) => void;
  onNavigate: (path: string) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function ProjectDetailsPanel({
  selectedProject,
  selectedClientProjects,
  onProjectClick,
  onNavigate,
}: ProjectDetailsPanelProps) {
  if (!selectedProject) {
    return (
      <div className="bg-white border border-neutral-200 p-10 text-center text-neutral-500">
        Select a project to view details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Client Info Card */}
        <div className="bg-white border border-neutral-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">Client Info</p>
            <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600">
              {selectedProject.status}
            </span>
          </div>
          <div className="space-y-2 text-sm text-neutral-600">
            <p className="font-semibold text-neutral-900">{selectedProject.clientName}</p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#143352]" />
              {selectedProject.clientPhone}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#143352]" />
              {selectedProject.clientEmail}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#143352]" />
              {selectedProject.clientSummary}
            </p>
          </div>
        </div>

        {/* Project Progress Card */}
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
                {Math.round(
                  (selectedProject.spentBudget / selectedProject.totalBudget) * 100
                )}%
              </span>
              <span className="text-xs text-neutral-500">Budget consumed</span>
            </div>
          </div>
        </div>

        {/* Cost Performance Index Card */}
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
        {/* Project Status Card */}
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
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (selectedProject.spentBudget / selectedProject.totalBudget) * 100
                      )
                    )}%`,
                  }}
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

        {/* Safety Metrics Card */}
        <div className="bg-white border border-neutral-200 p-5 space-y-3">
          <p className="text-sm font-semibold text-neutral-900">Safety Metrics</p>
          <div className="flex items-center gap-6">
            <div
              className="w-28 h-28 rounded-full"
              style={{
                background:
                  'conic-gradient(#F04040 0% 25%, #F4B400 25% 55%, #27AE60 55% 100%)',
              }}
            >
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

      {/* Projects Table */}
      <div className="bg-white border border-neutral-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <div>
            <p className="text-lg font-heading font-semibold text-neutral-900">Projects</p>
            <p className="text-sm text-neutral-500">
              All projects for {selectedProject.clientName}
            </p>
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
                  .filter(
                    (task) =>
                      !['Completed', 'Closed', 'Paid', 'Invoiced'].includes(task.status)
                  ).length;
                return (
                  <tr
                    key={projectRow.id}
                    className="border-t border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                    onClick={() => {
                      onProjectClick(projectRow.id);
                      onNavigate(`/projects/${projectRow.id}`);
                    }}
                  >
                    <td className="px-6 py-3 font-medium text-neutral-900">
                      <div>
                        <p>{projectRow.name}</p>
                        <p className="text-xs text-neutral-500 truncate">
                          {projectRow.clientSummary}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-neutral-600">
                      {mockCampuses.find((c) => c.id === projectRow.campusId)?.name ||
                        'Campus TBD'}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 font-medium ${
                          projectRow.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {projectRow.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-neutral-900">
                      {formatCurrency(projectRow.totalBudget)}
                    </td>
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
  );
}
