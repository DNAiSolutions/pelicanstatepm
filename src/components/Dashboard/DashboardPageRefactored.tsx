import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  mockWorkOrders,
  mockProjects,
  mockInvoices,
  getDashboardMetrics,
  getProjectMetrics,
  type Invoice,
} from '../../data/pipeline';
import { LeadIntakeModal } from '../leads/LeadIntakeModal';
import {
  DashboardHeader,
  DashboardMetrics,
  DashboardFeaturedProject,
  DashboardWorkOrders,
  DashboardNeedsAttention,
} from './index';

export function DashboardPageRefactored() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | 'inProgress' | 'completed'>('all');
  const [showLeadIntake, setShowLeadIntake] = useState(false);

  // Get metrics
  const metrics = useMemo(() => getDashboardMetrics(), []);

  // Get featured project (first project)
  const featuredProject = mockProjects[0];
  const featuredProjectMetrics = useMemo(() => {
    if (!featuredProject) return { budgetUsedPercent: 0, timelinePercent: 0 };
    
    void getProjectMetrics(featuredProject.id); // Used for side effects if any
    const start = new Date(featuredProject.startDate);
    const end = new Date(featuredProject.endDate);
    const today = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();
    const timelinePercent = Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);

    return {
      budgetUsedPercent: Math.round((featuredProject.spentBudget / featuredProject.totalBudget) * 100),
      timelinePercent,
    };
  }, [featuredProject]);

  // Filter work orders
  const filteredWorkOrders = useMemo(() => {
    let orders = [...mockWorkOrders];
    if (statusFilter === 'inProgress') {
      orders = orders.filter((wo) => ['InProgress', 'Scheduled'].includes(wo.status));
    } else if (statusFilter === 'completed') {
      orders = orders.filter((wo) => wo.status === 'Completed');
    }
    return orders.slice(0, 6);
  }, [statusFilter]);

  // Get work orders needing attention
  const blockedWorkOrders = useMemo(() => {
    return mockWorkOrders.filter((wo) => wo.status === 'Blocked');
  }, []);

  const awaitingApprovalWorkOrders = useMemo(() => {
    return mockWorkOrders.filter((wo) => wo.status === 'AwaitingApproval').slice(0, 3);
  }, []);

  // Get recent invoices
  const recentInvoices = useMemo(() => {
    return (mockInvoices as Invoice[])
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 3);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <DashboardHeader
        onNewIntakeClick={() => setShowLeadIntake(true)}
        onNewWorkRequestClick={() => navigate('/work-requests/new')}
      />

      {/* Metrics */}
      <DashboardMetrics metrics={metrics} />

      {/* Featured Project + Campus Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {featuredProject && (
          <DashboardFeaturedProject
            project={featuredProject}
            metrics={featuredProjectMetrics}
            onViewProjectClick={() => navigate('/projects')}
          />
        )}

        {/* Campus Overview */}
        <div className="bg-white border border-neutral-200 p-6 rounded-lg">
          <h2 className="text-xl font-heading font-bold text-neutral-900 mb-4">Campus Overview</h2>
          <div className="space-y-3">
            {mockProjects
              .reduce(
                (acc, p) => {
                  const existing = acc.find((c) => c.campusId === p.campusId);
                  if (existing) {
                    existing.count++;
                  } else {
                    acc.push({ campusId: p.campusId, count: 1, name: p.clientName });
                  }
                  return acc;
                },
                [] as Array<{ campusId: string | undefined; count: number; name: string }>
              )
              .map((campus, idx) => {
                if (!campus.campusId) return null;
                const campusWorkOrders = mockWorkOrders.filter((wo) =>
                  mockProjects.some((p) => p.id === wo.projectId && p.campusId === campus.campusId)
                );
                const activeCount = campusWorkOrders.filter((wo) =>
                  ['InProgress', 'Scheduled'].includes(wo.status)
                ).length;

                const campusId = campus.campusId;
                return (
                  <button
                    key={idx}
                    onClick={() => campusId && navigate(`/work-requests?campus=${campusId}`)}
                    className="w-full flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded hover:bg-neutral-100 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{campus.name}</p>
                      <p className="text-xs text-neutral-500">
                        {campusWorkOrders.length} work orders
                      </p>
                    </div>
                    {activeCount > 0 && (
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                        <span className="text-xs font-semibold text-blue-700">{activeCount}</span>
                      </div>
                    )}
                  </button>
                );
              })
              .filter((v) => v !== null)}
          </div>
        </div>
      </div>

      {/* Work Orders Table */}
      <DashboardWorkOrders
        workOrders={filteredWorkOrders}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onWorkOrderClick={(id) => navigate(`/work-requests/${id}`)}
        onViewAllClick={() => navigate('/work-requests')}
      />

      {/* Needs Attention + Invoices */}
      <DashboardNeedsAttention
        blockedWorkOrders={blockedWorkOrders}
        awaitingApprovalWorkOrders={awaitingApprovalWorkOrders}
        recentInvoices={recentInvoices}
        onWorkOrderClick={(id) => navigate(`/work-requests/${id}`)}
        onInvoiceClick={(id) => navigate(`/invoices/${id}`)}
        onViewAllInvoicesClick={() => navigate('/invoices')}
      />

      {/* Lead Intake Modal */}
      <LeadIntakeModal open={showLeadIntake} onClose={() => setShowLeadIntake(false)} />
    </div>
  );
}
