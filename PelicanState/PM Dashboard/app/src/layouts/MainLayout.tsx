import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
