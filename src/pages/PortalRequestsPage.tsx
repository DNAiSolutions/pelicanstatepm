import { useMemo, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContactPortalData } from '../hooks/useContactPortalData';
import { useAuth } from '../context/AuthContext';
import { workRequestService } from '../services/workRequestService';
import type { WorkRequest } from '../types';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  Requested: 'bg-slate-100 text-slate-700',
  Scoped: 'bg-sky-100 text-sky-800',
  AwaitingApproval: 'bg-amber-100 text-amber-800',
  Approved: 'bg-emerald-100 text-emerald-700',
  Scheduled: 'bg-cyan-100 text-cyan-800',
  InProgress: 'bg-blue-100 text-blue-800',
  Blocked: 'bg-rose-100 text-rose-800',
  Completed: 'bg-green-100 text-green-800',
  Invoiced: 'bg-purple-100 text-purple-800',
  Paid: 'bg-emerald-100 text-emerald-800',
  Intake: 'bg-slate-100 text-slate-700',
  Scoping: 'bg-blue-100 text-blue-700',
  Estimate: 'bg-sky-100 text-sky-800',
  Approval: 'bg-amber-100 text-amber-800',
  Schedule: 'bg-cyan-100 text-cyan-800',
  Progress: 'bg-blue-100 text-blue-800',
  Complete: 'bg-green-100 text-green-800',
  Invoice: 'bg-purple-100 text-purple-800',
};

export function PortalRequestsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const contactId = params.get('contactId');
  const portalData = useContactPortalData(contactId);
  const { user } = useAuth();
  const isDemoProfile = (user?.email ?? '').toLowerCase() === 'demo@pelicanstate.com';
  const { workOrders, accountName, companyName, viewingMessage } = portalData;
  const [remoteRequests, setRemoteRequests] = useState<WorkRequest[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  useEffect(() => {
    if (isDemoProfile) return;
    let isMounted = true;
    async function loadRequests() {
      try {
        setLoadingRemote(true);
        const filters = contactId ? { client_contact_id: contactId } : undefined;
        const data = await workRequestService.getWorkRequests(filters);
        if (!isMounted) return;
        setRemoteRequests(data);
      } catch (error) {
        console.error('Unable to load portal requests', error);
        toast.error('Unable to load client requests');
      } finally {
        if (isMounted) setLoadingRemote(false);
      }
    }
    loadRequests();
    return () => {
      isMounted = false;
    };
  }, [isDemoProfile, contactId]);

  type PortalRequestRow = {
    id: string;
    title: string;
    requestNumber: string;
    status: string;
    property: string;
    percentComplete: number;
  };

  const requestRows = useMemo<PortalRequestRow[]>(() => {
    if (isDemoProfile) {
      return workOrders.map((request) => ({
        id: request.id,
        title: request.title,
        requestNumber: request.requestNumber,
        status: request.status,
        property: request.locationDetail || 'TBD',
        percentComplete: request.percentComplete ?? 0,
      }));
    }
    return remoteRequests.map((request) => {
      const intakePayload = (request.intake_payload ?? {}) as Record<string, any>;
      const progressValue = typeof intakePayload.progress === 'number' ? intakePayload.progress : 0;
      return {
        id: request.id,
        title: request.title || request.description || 'Untitled request',
        requestNumber: request.request_number,
        status: request.status,
        property: request.property || 'TBD',
        percentComplete: progressValue,
      };
    });
  }, [isDemoProfile, workOrders, remoteRequests]);

  const activeCount = useMemo(() => {
    const closedStatuses = ['Completed', 'Invoiced', 'Paid', 'Complete', 'Invoice'];
    return requestRows.filter((row) => !closedStatuses.includes(row.status)).length;
  }, [requestRows]);

  const completedCount = useMemo(() => {
    const doneStatuses = ['Completed', 'Paid', 'Complete', 'Invoice'];
    return requestRows.filter((row) => doneStatuses.includes(row.status)).length;
  }, [requestRows]);

  const contactQuery = contactId ? `?contactId=${contactId}` : '';

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Client Portal</p>
            <h1 className="text-2xl font-heading font-bold text-neutral-900">Requests</h1>
            <p className="text-sm text-neutral-600">{accountName} • {companyName}</p>
            {viewingMessage && <p className="text-xs text-emerald-600 mt-1">{viewingMessage}</p>}
          </div>
          <button
            onClick={() => navigate(`/client-portal/requests/new${contactQuery}`)}
            className="px-4 py-2 border border-neutral-300 text-sm rounded-full"
          >
            New request
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 p-5 rounded-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Open requests</p>
            <p className="text-3xl font-heading font-semibold text-neutral-900">{activeCount}</p>
            <p className="text-sm text-neutral-500">Awaiting scheduling or approval</p>
          </div>
          <div className="bg-white border border-neutral-200 p-5 rounded-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Completed</p>
            <p className="text-3xl font-heading font-semibold text-neutral-900">{completedCount}</p>
            <p className="text-sm text-neutral-500">Finished in the last 12 months</p>
          </div>
          <div className="bg-white border border-neutral-200 p-5 rounded-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Next steps</p>
            <p className="text-sm text-neutral-600">
              Use this page to request new work, review statuses, or share site details with Pelican State.
            </p>
          </div>
        </section>

        <section className="bg-white border border-neutral-200 rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading font-semibold text-neutral-900">Request tracker</h2>
              <p className="text-sm text-neutral-500">{requestRows.length} total requests tied to your account.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs uppercase text-neutral-500">
                <tr>
                  <th className="text-left px-6 py-3">Request</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Property</th>
                  <th className="text-left px-6 py-3">Progress</th>
                </tr>
              </thead>
              <tbody>
                {(!isDemoProfile && loadingRemote) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-6 text-center text-neutral-500">Loading requests…</td>
                  </tr>
                )}
                {(!loadingRemote || isDemoProfile) &&
                  requestRows.map((request) => (
                    <tr key={request.id} className="border-t border-neutral-100">
                      <td className="px-6 py-4">
                        <p className="font-medium text-neutral-900">{request.title}</p>
                        <p className="text-xs text-neutral-500">{request.requestNumber}</p>
                      </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[request.status] || 'bg-neutral-100 text-neutral-700'}`}>
                        {request.status}
                      </span>
                    </td>
                      <td className="px-6 py-4 text-neutral-600">{request.property}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-32 bg-neutral-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0f2749]" style={{ width: `${request.percentComplete}%` }} />
                          </div>
                          <span className="text-xs text-neutral-500">{request.percentComplete}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                {(!loadingRemote || isDemoProfile) && requestRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                      No requests yet. Submit one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
