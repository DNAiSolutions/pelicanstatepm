import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  DollarSign, 
  Calendar,
  BarChart3,
  Settings,
  Users,
  LogOut,
  Building2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/work-requests', label: 'Work Requests', icon: FolderKanban },
    { path: '/estimates', label: 'Estimates', icon: FileText },
    { path: '/invoices', label: 'Invoices', icon: DollarSign },
    { path: '/schedules', label: 'Schedule', icon: Calendar },
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

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside className={`bg-[#1F2933] flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header / Logo */}
      <div className="p-6 flex items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#143352] flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-heading font-semibold text-white text-lg">Pelican</span>
              <span className="font-heading font-medium text-white/70 text-lg ml-1">State</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                  active
                    ? 'bg-[#143352] text-white border-l-4 border-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
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
      <div className="p-4 border-t border-white/10">
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-[#143352] flex items-center justify-center text-white font-semibold text-sm rounded-full">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
              <p className="text-xs text-white/50">{user.role || 'User'}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white transition-all"
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
