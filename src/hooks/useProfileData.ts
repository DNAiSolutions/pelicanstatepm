import { useAuth } from '../context/AuthContext';
import {
  mockProjects,
  mockWorkOrders,
  mockContacts,
  mockLeads,
  mockInvoices,
  mockCampuses,
  mockQuotes,
  getDashboardMetrics,
  getProjectMetrics,
} from '../data/pipeline';

/**
 * Hook that returns empty data for admin profile, mock data for demo profile
 * Use this to make all pages profile-aware
 */
export function useProfileData() {
  const { user } = useAuth();
  const isAdminProfile = user?.email === 'admin@pelicanstate.com';

  return {
    isAdminProfile,
    projects: isAdminProfile ? [] : mockProjects,
    workOrders: isAdminProfile ? [] : mockWorkOrders,
    contacts: isAdminProfile ? [] : mockContacts,
    leads: isAdminProfile ? [] : mockLeads,
    invoices: isAdminProfile ? [] : mockInvoices,
    campuses: isAdminProfile ? [] : mockCampuses,
    quotes: isAdminProfile ? [] : mockQuotes,
    metrics: isAdminProfile ? { activeValue: 0, inProgressCount: 0, awaitingApprovalCount: 0, completedCount: 0, blockedCount: 0 } : getDashboardMetrics(),
    getProjectMetrics: (projectId: string) => isAdminProfile ? { total: 0, completed: 0 } : getProjectMetrics(projectId),
  };
}
