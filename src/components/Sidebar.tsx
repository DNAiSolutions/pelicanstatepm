import {
  LayoutDashboard,
  FolderKanban,
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
  ClipboardList,
  BookOpen,
  Handshake,
  UserCircle2,
  ChevronDown
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const location = useLocation();
  const { signOut, user, switchProfile } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const mainMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/contacts', label: 'Contacts', icon: UserCircle2 },
    { path: '/leads', label: 'Leads', icon: Handshake },
    {
      path: '/projects',
      label: 'Projects',
      icon: FolderKanban,
      children: [
        { path: '/walkthroughs', label: 'Walkthroughs', icon: ClipboardList },
        { path: '/estimates', label: 'Estimates', icon: FileText },
        { path: '/invoices', label: 'Invoices', icon: DollarSign },
        { path: '/work-requests', label: 'Work Orders', icon: ClipboardList },
      ],
    },
    { path: '/historic-documentation', label: 'Historic Docs', icon: BookOpen },
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
              const hasChildren = !!item.children;
              const childIsActive = hasChildren
                ? item.children!.some((child) => isActive(child.path))
                : false;
              const isExpanded = expandedMenus.has(item.path);
              const shouldShowChildren = !isCollapsed && hasChildren && (isExpanded || childIsActive);

              return (
                <div key={item.path} className="space-y-1">
                  <div className="flex items-center">
                    <Link
                      to={item.path}
                      className={`flex-1 flex items-center gap-3 px-3 py-2.5 transition-all ${
                        active ? 'bg-primary-500 text-white' : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                    </Link>
                    {!isCollapsed && hasChildren && (
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedMenus((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.path)) {
                              next.delete(item.path);
                            } else {
                              next.add(item.path);
                            }
                            return next;
                          });
                        }}
                        className={`p-2 transition-all ${
                          active ? 'text-white' : 'text-neutral-400 hover:text-neutral-700'
                        }`}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  {shouldShowChildren && (
                    <div className="ml-8 border-l border-neutral-200 pl-3 space-y-1">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.path);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-2 px-2 py-1 text-xs rounded ${
                              childActive ? 'text-[#143352] font-semibold' : 'text-neutral-600 hover:text-[#143352]'
                            }`}
                          >
                            <ChildIcon className="w-4 h-4" /> {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
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
                      ? 'bg-primary-500 text-white'
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

        {/* Client View links removed per request */}

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
      <div className="p-4 border-t border-neutral-200 relative">
        {!isCollapsed && user && (
          <>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 mb-3 p-2 hover:bg-neutral-100 transition-all rounded"
            >
              <div className="w-10 h-10 bg-primary-500 flex items-center justify-center text-white font-semibold text-sm rounded-full flex-shrink-0">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-neutral-900 truncate">{user.email?.split('@')[0]}</p>
                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Menu Dropdown */}
            {showProfileMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-neutral-200 rounded shadow-lg z-50">
                <button
                  onClick={() => {
                    switchProfile('demo');
                    setShowProfileMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all ${
                    user.email === 'demo@pelicanstate.com'
                      ? 'bg-blue-50 text-[#143352]'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Demo Profile
                  <span className="block text-xs text-neutral-500">demo@pelicanstate.com</span>
                </button>
                <button
                  onClick={() => {
                    switchProfile('admin');
                    setShowProfileMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all border-t border-neutral-100 ${
                    user.email === 'admin@pelicanstate.com'
                      ? 'bg-blue-50 text-[#143352]'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Admin Profile
                  <span className="block text-xs text-neutral-500">admin@pelicanstate.com</span>
                </button>
              </div>
            )}
          </>
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
