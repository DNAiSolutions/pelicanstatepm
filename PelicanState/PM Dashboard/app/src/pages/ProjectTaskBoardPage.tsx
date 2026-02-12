import { useEffect, useMemo, useState } from 'react';
import { projectService } from '../services/projectService';
import { projectTaskService } from '../services/projectTaskService';
import { mockUsers, type Project, type WorkOrder } from '../data/pipeline';
import { Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const columnsOrder: Array<'todo' | 'inprogress' | 'done'> = ['todo', 'inprogress', 'done'];
const columnLabels: Record<'todo' | 'inprogress' | 'done', string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  done: 'Done',
};

export function ProjectTaskBoardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState<WorkOrder[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await projectService.getProjects();
        setProjects(data);
        const first = data[0]?.id;
        if (first) {
          setSelectedProjectId(first);
          setTasks(projectTaskService.getByProject(first));
        }
      } catch (error) {
        toast.error('Unable to load projects');
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      setTasks(projectTaskService.getByProject(selectedProjectId));
    }
  }, [selectedProjectId]);

  const selectedProject = useMemo(() => projects.find((p) => p.id === selectedProjectId), [projects, selectedProjectId]);

  const columns = useMemo(() => {
    const map = { todo: [] as WorkOrder[], inprogress: [] as WorkOrder[], done: [] as WorkOrder[] };
    tasks.forEach((task) => {
      map[projectTaskService.getColumnForStatus(task.status)].push(task);
    });
    return map;
  }, [tasks]);

  if (!selectedProject) {
    return <div className="p-8 text-center text-neutral-500">No projects available.</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">Project</p>
          <h1 className="text-3xl font-heading font-semibold text-neutral-900">{selectedProject.name}</h1>
          <p className="text-sm text-neutral-500">{selectedProject.startDate} – {selectedProject.endDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="px-4 py-2 rounded-full border border-neutral-200 text-neutral-700 text-sm font-semibold">
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.clientName} — {project.name}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 rounded-full bg-[#143352] text-white text-sm font-semibold">Task Board</button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {mockUsers.slice(0, 5).map((user) => (
              <img key={user.id} src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white" />
            ))}
          </div>
          <span className="text-sm text-neutral-500">+{Math.max(projects.length - 5, 0)} more collaborators</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-full bg-[#143352] text-white text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add task
          </button>
          <button className="px-4 py-2 rounded-full border border-neutral-200 text-neutral-700 text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Assign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columnsOrder.map((columnId) => (
          <div key={columnId} className="bg-white border border-neutral-200 rounded-3xl p-4 space-y-4 min-h-[340px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{columnLabels[columnId]}</p>
                <p className="text-xs text-neutral-500">{columns[columnId].length} tasks</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center">+</button>
            </div>
            <div className="space-y-4">
              {columns[columnId].map((task) => (
                <div key={task.id} className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-card space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{task.title}</p>
                    <p className="text-sm text-neutral-500">{task.description}</p>
                  </div>
                  <p className="text-xs text-neutral-500">Materials: {task.aiMaterialSummary || 'TBD'}</p>
                  <p className="text-xs text-neutral-500">Labor: {task.aiLaborSummary || 'TBD'}</p>
                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <span>{task.targetEndDate || 'TBD'}</span>
                    <span>{task.priority}</span>
                  </div>
                </div>
              ))}
              {columns[columnId].length === 0 && <p className="text-xs text-neutral-500">No tasks in this column.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
