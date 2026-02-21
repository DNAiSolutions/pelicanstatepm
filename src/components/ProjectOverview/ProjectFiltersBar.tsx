import { Search, Plus } from 'lucide-react';
import { mockProperties } from '../../data/pipeline';

interface ProjectFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  propertyFilter: string;
  onPropertyFilterChange: (value: string) => void;
  onNewProjectClick: () => void;
}

export function ProjectFiltersBar({
  search,
  onSearchChange,
  propertyFilter,
  onPropertyFilterChange,
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
            className="pl-10 pr-4 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2749]"
          />
        </div>
        <select
          value={propertyFilter}
          onChange={(e) => onPropertyFilterChange(e.target.value)}
          className="px-3 py-2 border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2749]"
        >
          <option value="">All Properties</option>
          {mockProperties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
        <button
          onClick={onNewProjectClick}
          className="inline-flex items-center gap-2 bg-[#0f2749] text-white px-4 py-2"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>
    </div>
  );
}
