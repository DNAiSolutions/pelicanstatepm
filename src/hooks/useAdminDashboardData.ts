import { useEffect, useMemo, useState } from 'react';
import {
  type DashboardCampus,
  type DashboardInvoice,
  type DashboardWorkRequest,
  type DashboardMetrics,
  fetchAdminCampuses,
  fetchAdminInvoices,
  fetchAdminWorkRequests,
  mapMetrics,
} from '../services/adminDataService';

interface AdminDashboardState {
  loading: boolean;
  error: string | null;
  workRequests: DashboardWorkRequest[];
  campuses: DashboardCampus[];
  invoices: DashboardInvoice[];
}

const initialState: AdminDashboardState = {
  loading: false,
  error: null,
  workRequests: [],
  campuses: [],
  invoices: [],
};

export function useAdminDashboardData(enabled: boolean) {
  const [state, setState] = useState<AdminDashboardState>(initialState);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      if (state.loading || state.error || state.workRequests.length) {
        setState(initialState);
      }
      return;
    }

    let isMounted = true;

    async function load() {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [workRequests, campuses, invoices] = await Promise.all([
          fetchAdminWorkRequests(),
          fetchAdminCampuses(),
          fetchAdminInvoices(),
        ]);

        if (!isMounted) return;
        setState({ loading: false, error: null, workRequests, campuses, invoices });
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
  }, [enabled, reloadKey]);

  const metrics: DashboardMetrics = useMemo(() => mapMetrics(state.workRequests), [state.workRequests]);

  return {
    ...state,
    metrics,
    reload: () => setReloadKey((prev) => prev + 1),
  };
}
