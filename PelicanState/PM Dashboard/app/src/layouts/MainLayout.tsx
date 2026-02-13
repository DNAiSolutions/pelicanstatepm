import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Search, Bell, Mail, Plus } from 'lucide-react';

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Mock avatars for header
  const collaborators = [
    { initials: 'WL', color: 'bg-blue-500' },
    { initials: 'MC', color: 'bg-green-500' },
    { initials: 'SM', color: 'bg-purple-500' },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.includes('projects')) return 'Projects';
    if (path.includes('buildings')) return 'Buildings';
    if (path.includes('estimates')) return 'Estimate';
    if (path.includes('billing')) return 'Billing';
    if (path.includes('schedules')) return 'Schedule';
    if (path.includes('analytics')) return 'Analytics';
    if (path.includes('integrations')) return 'Integration';
    if (path.includes('performance')) return 'Performance';
    if (path.includes('members')) return 'Members';
    return 'Dashboard';
  };

  const getPageSubtitle = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return `Operations Command Center · ${today.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Sidebar */}
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar Header */}
        <header className="bg-white border-b border-neutral-200 h-20 flex items-center justify-between px-8 flex-shrink-0">
          {/* Left: Page Title Block */}
          <div>
            <h1 className="text-lg font-heading font-semibold text-neutral-900">{getPageTitle()}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{getPageSubtitle()}</p>
          </div>

          {/* Center: Search */}
          <div className="flex-1 mx-8 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-12 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:outline-none focus:border-neutral-400 rounded-full"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-xs">⌘</kbd>
                <span>F</span>
              </span>
            </div>
          </div>

          {/* Right: Action Cluster */}
          <div className="flex items-center gap-4">
            {/* Collaborator Avatars */}
            <div className="flex items-center -space-x-2">
              {collaborators.map((collab, idx) => (
                <div
                  key={idx}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white ${collab.color}`}
                >
                  {collab.initials}
                </div>
              ))}
              <button className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-300 transition-colors border-2 border-white">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Icon Buttons */}
            <button className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors">
              <Mail className="w-5 h-5" />
            </button>
            <button className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors relative">
              <Bell className="w-5 h-5" />
            </button>

            {/* Export Button - Orange Pill */}
            <button className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
              Export
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
