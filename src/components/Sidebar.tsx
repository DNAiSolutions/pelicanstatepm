import {
  LayoutDashboard,
  CalendarDays,
  Users2,
  Inbox,
  FileText,
  Briefcase,
  DollarSign,
  CreditCard,
  Sparkles,
  RadioTower,
  BarChart3,
  AppWindow,
  Gift,
  LogOut,
  Settings,
  Building2,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}

type NavSection = {
  title?: string;
  items: {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
};

export function Sidebar({ isCollapsed }: SidebarProps) {
  const location = useLocation();
  const { signOut, user, isDevelopmentProfile } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const navSections: NavSection[] = [
    {
      title: 'Operations',
      items: [
        { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
        { path: '/projects', label: 'Jobs', icon: Briefcase },
        { path: '/projects/board', label: 'Schedule', icon: CalendarDays },
        { path: '/contacts', label: 'Clients', icon: Users2 },
        { path: '/properties', label: 'Properties', icon: Building2 },
      ],
    },
    {
      title: 'Workflows',
      items: [
        { path: '/work-requests', label: 'Requests', icon: Inbox },
        { path: '/quotes', label: 'Quotes', icon: FileText },
        { path: '/invoices', label: 'Invoices', icon: DollarSign },
        { path: '/payments', label: 'Payments', icon: CreditCard },
      ],
    },
    {
      title: 'Growth',
      items: [
        { path: '/leads', label: 'Marketing', icon: Sparkles },
        { path: '/historic-documentation', label: 'Receptionist', icon: RadioTower },
        { path: '/analytics', label: 'Insights', icon: BarChart3 },
      ],
    },
    {
      title: 'Community',
      items: [
        { path: '/integrations', label: 'Apps', icon: AppWindow },
        { path: '/members', label: 'Members', icon: Users2 },
        { path: '/refer', label: 'Refer & Earn', icon: Gift },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside
      className={`bg-white shadow-[0_30px_70px_rgba(20,51,82,0.08)] flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-24' : 'w-64'
      }`}
      style={{ borderRadius: '0 32px 32px 0' }}
    >
      <div className="px-6 pt-8 pb-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--brand-primary)] text-white font-heading text-lg flex items-center justify-center">
            PS
          </div>
          {!isCollapsed && (
            <div>
              <p className="font-heading text-base font-semibold text-[var(--text-body)]">Pelican State</p>
              <p className="text-xs text-[var(--text-muted)]">Building Group</p>
            </div>
          )}
        </div>
        {/* Removed quick-create CTA to keep sidebar focused on navigation */}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            {!isCollapsed && section.title && (
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)] px-2 mb-3">{section.title}</p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-[rgba(15,109,55,0.12)] text-[var(--brand-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-body)] hover:bg-[rgba(15,109,55,0.08)]'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-[var(--brand-primary)]' : ''}`} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-6 border-t border-[var(--border-subtle)]">
        {!isCollapsed && user && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-[var(--text-body)]">{user.email?.split('@')[0] ?? 'Signed In'}</p>
            <p className="text-xs text-[var(--text-muted)]">{user.email ?? 'Connected'}</p>
            {isDevelopmentProfile && (
              <span className="inline-flex text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full px-3 py-0.5 mt-2">
                Development Profile
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="flex-1 inline-flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-full border"
          >
            <Settings className="w-4 h-4" />
            {!isCollapsed && 'Settings'}
          </Link>
          <button
            onClick={handleSignOut}
            className="flex-1 inline-flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-full border"
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && 'Logout'}
          </button>
        </div>
      </div>
    </aside>
  );
}
