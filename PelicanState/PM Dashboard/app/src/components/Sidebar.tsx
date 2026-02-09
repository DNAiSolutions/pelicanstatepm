import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  DollarSign, 
  Calendar,
  BarChart3,
  Settings,
  Users,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/work-requests', label: 'Work Requests', icon: FolderKanban },
    { path: '/estimates', label: 'Estimates', icon: FileText },
    { path: '/invoices', label: 'Invoices', icon: DollarSign },
    { path: '/schedules', label: 'Schedule', icon: Calendar },
  ];

  const otherItems = [
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/members', label: 'Members', icon: Users },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className={`bg-white border-r border-neutral-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-neutral-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 flex items-center justify-center text-white font-bold font-heading">
            P
          </div>
          {!isCollapsed && (
            <span className="font-heading font-semibold text-neutral-900">PelicanState</span>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-neutral-100 transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronLeft className={`w-5 h-5 text-neutral-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          <div className="px-3 mb-2">
            {!isCollapsed && (
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Main Menu</p>
            )}
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center justify-between px-3 py-2.5 transition-all ${
                  active
                    ? 'bg-primary-500 text-white shadow-soft'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Other Section */}
        <nav className="px-3 space-y-1 mt-6">
          <div className="px-3 mb-2">
            {!isCollapsed && (
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Other</p>
            )}
          </div>
          {otherItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 transition-all ${
                  active
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Sign Out */}
      <div className="p-4 border-t border-neutral-100 space-y-3">
        {!isCollapsed && user && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{user.email}</p>
              <p className="text-xs text-neutral-500">{user.role || 'User'}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-neutral-600 hover:bg-neutral-50 transition-all"
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
