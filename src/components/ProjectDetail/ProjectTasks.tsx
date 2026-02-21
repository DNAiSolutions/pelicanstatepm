import { Plus } from 'lucide-react';
import type { WorkOrder } from '../../data/pipeline';

export interface ProjectTasksProps {
  tasks: WorkOrder[];
  onAddTask?: () => void;
  onTaskClick?: (task: WorkOrder) => void;
}

export function ProjectTasks({ tasks, onAddTask, onTaskClick }: ProjectTasksProps) {
  return (
    <section className="bg-white border border-neutral-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
        <div>
          <p className="text-lg font-heading font-semibold text-neutral-900">Tasks</p>
          <p className="text-sm text-neutral-500">Work orders connected to this project</p>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#0f2749] rounded-lg hover:bg-[#0f2749]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="text-xs uppercase text-neutral-500 bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left">Task</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Priority</th>
              <th className="px-6 py-3 text-left">Target Date</th>
            </tr>
          </thead>
          <tbody className="text-sm text-neutral-700">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-neutral-500">
                  No tasks yet
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-t border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
                  onClick={() => onTaskClick?.(task)}
                >
                  <td className="px-6 py-3 font-medium">{task.title}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">{task.priority}</td>
                  <td className="px-6 py-3">{task.targetEndDate || 'TBD'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
