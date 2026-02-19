import { Search, Plus } from 'lucide-react';
import { mockCampuses } from '../../data/pipeline';

interface ProjectFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  campusFilter: string;
  onCampusFilterChange: (value: string) => void;
  onNewProjectClick: () => void;
}

export function ProjectFiltersBar({
  search,
  onSearchChange,
  campusFilter,
  onCampusFilterChange,
  onNewProjectClick,
}: ProjectFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Portfolio</p>
        <h1 className="text-3xl font-heading font-bold text-neutral-900">
          Pelican State Projects
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects or clients"
            className="pl-10 pr-4 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#143352]"
          />
        </div>
        <select
          value={campusFilter}
          onChange={(e) => onCampusFilterChange(e.target.value)}
          className="px-3 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#143352]"
        >
          <option value="">All Campuses</option>
          {mockCampuses.map((campus) => (
            <option key={campus.id} value={campus.id}>
              {campus.name}
            </option>
          ))}
        </select>
        <button
          onClick={onNewProjectClick}
          className="inline-flex items-center gap-2 bg-[#143352] text-white px-4 py-2"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>
    </div>
  );
}
