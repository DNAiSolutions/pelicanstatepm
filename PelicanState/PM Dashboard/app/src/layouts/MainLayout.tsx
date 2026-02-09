import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Search, Bell, Mail, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.includes('work-requests')) return 'Work Requests';
    if (path.includes('estimates')) return 'Estimates';
    if (path.includes('invoices')) return 'Invoices';
    if (path.includes('schedules')) return 'Schedule';
    if (path.includes('analytics')) return 'Analytics';
    if (path.includes('members')) return 'Members';
    if (path.includes('settings')) return 'Settings';
    return 'Dashboard';
  };

  const getSubTitle = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-6">
          {/* Left - Page Title */}
          <div>
            <h1 className="font-heading text-xl font-semibold text-[#1F2933]">{getPageTitle()}</h1>
            <p className="text-sm text-neutral-500">{getSubTitle()}</p>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64 border border-neutral-200 focus:outline-none focus:border-[#143352] text-sm"
              />
            </div>

            {/* New Work Request Button */}
            <Link
              to="/work-requests/new"
              className="flex items-center gap-2 bg-[#143352] hover:bg-[#0F1F2D] text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Work Request
            </Link>

            {/* Notifications */}
            <button className="relative p-2 text-neutral-600 hover:text-[#1F2933]">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Messages */}
            <button className="p-2 text-neutral-600 hover:text-[#1F2933]">
              <Mail className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
