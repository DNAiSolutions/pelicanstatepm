import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import { workRequestService } from '../services/workRequestService';
import { contactService } from '../services/contactService';
import { leadService } from '../services/leadService';
import { invoiceService } from '../services/invoiceService';
import { propertyService } from '../services/propertyService';
import type { Project, WorkRequest, Contact, Lead, Invoice, Property } from '../types';

/**
 * Hook that returns live data from Supabase
 */
export function useProfileData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    projects: [] as Project[],
    workOrders: [] as WorkRequest[],
    contacts: [] as Contact[],
    leads: [] as Lead[],
    invoices: [] as Invoice[],
    properties: [] as Property[],
    quotes: [] as any[], // Using any for quotes transition
    metrics: {
      active_value: 0,
      in_progress_count: 0,
      awaiting_approval_count: 0,
      completed_count: 0,
      blocked_count: 0,
    },
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const [
          projects,
          workOrders,
          contacts,
          leads,
          invoices,
          properties
        ] = await Promise.all([
          projectService.getProjects(),
          workRequestService.getWorkRequests(),
          contactService.list(),
          leadService.list(),
          invoiceService.getInvoices(),
          propertyService.list()
        ]);

        // Calculate basic metrics
        const metrics = {
          active_value: invoices.reduce((sum: number, inv: Invoice) => sum + (inv.total_amount || 0), 0),
          in_progress_count: workOrders.filter(wo => wo.status === 'Progress' || wo.status === 'InProgress').length,
          awaiting_approval_count: workOrders.filter(wo => wo.status === 'Approval' || wo.status === 'Estimate').length,
          completed_count: workOrders.filter(wo => wo.status === 'Complete' || wo.status === 'Completed').length,
          blocked_count: workOrders.filter(wo => (wo as any).status === 'Blocked').length,
        };

        setData({
          projects,
          workOrders,
          contacts,
          leads,
          invoices,
          properties,
          quotes: [], // Transitioning
          metrics,
        });
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  return {
    ...data,
    loading,
    isAdminProfile: false, // Live data — all pages load from Supabase
    getProjectMetrics: (projectId: string) => {
      const projectWork = data.workOrders.filter(wo => (wo as any).project_id === projectId);
      return {
        total: projectWork.length,
        completed: projectWork.filter(wo => wo.status === 'Complete').length,
      };
    },
  };
}
