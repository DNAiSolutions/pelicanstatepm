import { 
  LayoutDashboard, 
  FolderKanban, 
  Building2,
  FileText, 
  DollarSign, 
  Calendar,
  BarChart3,
  Zap,
  TrendingUp,
  Users,
  LogOut,
  Info,
  Settings,
  ChevronRight
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

  const mainMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: FolderKanban, badge: '28' },
    { path: '/buildings', label: 'Buildings', icon: Building2 },
    { path: '/estimates', label: 'Estimate', icon: FileText },
    { path: '/billing', label: 'Billing', icon: DollarSign, badge: '14' },
    { path: '/schedules', label: 'Schedule', icon: Calendar },
  ];

  const otherMenuItems = [
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/integrations', label: 'Integration', icon: Zap },
    { path: '/performance', label: 'Performance', icon: TrendingUp },
    { path: '/members', label: 'Members', icon: Users },
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
    <aside className={`bg-white border border-neutral-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-64'}`} style={{ borderRadius: '20px', margin: '16px', marginRight: '0px', height: 'calc(100vh - 32px)' }}>
      {/* Brand Block */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-900 flex items-center justify-center text-white font-bold text-sm rounded-full">
            P
          </div>
          {!isCollapsed && (
            <div>
              <div className="font-heading font-bold text-neutral-900 text-sm">Pelican</div>
              <div className="font-body text-xs text-neutral-500">Building Dreams</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Menu Section */}
      <div className="flex-1 overflow-y-auto">
        <nav className="px-3 py-4">
          {!isCollapsed && (
            <div className="px-3 mb-4">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Main Menu</p>
            </div>
          )}
          
          <div className="space-y-1">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all ${
                    active
                      ? 'bg-orange-500 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.badge && (
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                          active ? 'bg-white/20' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Other Section */}
        <nav className="px-3 py-4 border-t border-neutral-200">
          {!isCollapsed && (
            <div className="px-3 mb-4">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Other</p>
            </div>
          )}
          
          <div className="space-y-1">
            {otherMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all ${
                    active
                      ? 'bg-orange-500 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Utilities */}
        <nav className="px-3 py-4 border-t border-neutral-200">
          <div className="space-y-1">
            <Link
              to="/information"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-neutral-700 hover:bg-neutral-100 transition-all"
              title={isCollapsed ? 'Information' : undefined}
            >
              <Info className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium text-sm">Information</span>}
            </Link>
            <Link
              to="/settings"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-neutral-700 hover:bg-neutral-100 transition-all"
              title={isCollapsed ? 'Settings' : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
            </Link>
          </div>
        </nav>
      </div>

      {/* User Profile Block */}
      <div className="p-4 border-t border-neutral-200">
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500 flex items-center justify-center text-white font-semibold text-sm rounded-full flex-shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">{user.email?.split('@')[0]}</p>
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-neutral-700 hover:bg-neutral-100 transition-all"
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
