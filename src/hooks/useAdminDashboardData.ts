import { useEffect, useMemo, useState } from 'react';
import {
  type DashboardProperty,
  type DashboardInvoice,
  type DashboardWorkRequest,
  type DashboardMetrics,
  type DashboardQuote,
  type DashboardProject,
  fetchAdminProperties,
  fetchAdminInvoices,
  fetchAdminProjects,
  fetchAdminQuotes,
  fetchAdminWorkRequests,
  mapMetrics,
} from '../services/adminDataService';

interface AdminDashboardState {
  loading: boolean;
  error: string | null;
  workRequests: DashboardWorkRequest[];
  properties: DashboardProperty[];
  invoices: DashboardInvoice[];
  projects: DashboardProject[];
  quotes: DashboardQuote[];
}

const initialState: AdminDashboardState = {
  loading: false,
  error: null,
  workRequests: [],
  properties: [],
  invoices: [],
  projects: [],
  quotes: [],
};

export function useAdminDashboardData(enabled: boolean, propertyIds: string[]) {
  const [state, setState] = useState<AdminDashboardState>(initialState);
  const [reloadKey, setReloadKey] = useState(0);
  const filteredPropertyIds = Array.from(new Set(propertyIds.filter(Boolean))).sort();
  const propertyKey = filteredPropertyIds.join('|');

  useEffect(() => {
    if (!enabled) {
      if (state.loading || state.error || state.workRequests.length) {
        setState(initialState);
      }
      return;
    }

    if (filteredPropertyIds.length === 0) {
      if (state.loading || state.error || state.workRequests.length || state.properties.length || state.invoices.length) {
        setState(initialState);
      }
      return;
    }

    let isMounted = true;

    async function load() {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [workRequests, properties, invoices, projects, quotes] = await Promise.all([
          fetchAdminWorkRequests(filteredPropertyIds),
          fetchAdminProperties(filteredPropertyIds),
          fetchAdminInvoices(filteredPropertyIds),
          fetchAdminProjects(filteredPropertyIds),
          fetchAdminQuotes(filteredPropertyIds, 8),
        ]);

        if (!isMounted) return;
        setState({ loading: false, error: null, workRequests, properties, invoices, projects, quotes });
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Failed to load Supabase data';
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [enabled, reloadKey, propertyKey]);

  const metrics: DashboardMetrics = useMemo(() => mapMetrics(state.workRequests), [state.workRequests]);

  return {
    ...state,
    metrics,
    reload: () => setReloadKey((prev) => prev + 1),
  };
}
