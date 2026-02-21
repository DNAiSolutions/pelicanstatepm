import { useCallback, useEffect, useMemo, useState } from 'react';
import { propertyService, type Property } from '../services/propertyService';
import { siteWalkthroughService } from '../services/siteWalkthroughService';
import type { SiteWalkthrough, SiteFinding } from '../types';
import { walkthroughSessionService } from '../services/walkthroughSessionService';
import type { WalkthroughSessionRecord } from '../data/pipeline';
import { useProfileData } from '../hooks/useProfileData';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  PlusCircle,
  Target,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSavedWalkthroughDraft, clearWalkthroughDraft } from '../services/walkthroughDraftService';
import { useAuth } from '../context/AuthContext';

const severityChip: Record<SiteFinding['severity'], string> = {
  Critical: 'bg-red-50 text-red-700 border border-red-200',
  High: 'bg-amber-50 text-amber-700 border border-amber-200',
  Medium: 'bg-blue-50 text-blue-700 border border-blue-200',
  Low: 'bg-neutral-50 text-neutral-600 border border-neutral-200',
  Info: 'bg-sky-50 text-sky-700 border border-sky-200',
};

const statusBadge: Record<string, string> = {
  Scheduled: 'bg-blue-50 text-blue-700 border border-blue-200',
  InProgress: 'bg-amber-50 text-amber-700 border border-amber-200',
  'In Progress': 'bg-amber-50 text-amber-700 border border-amber-200',
  Complete: 'bg-green-50 text-green-700 border border-green-200',
};

export function SiteWalkthroughPage() {
  const { leads: mockLeads } = useProfileData();
  const { user } = useAuth();
  const propertyAssignments = useMemo(() => user?.propertyAssigned?.filter(Boolean) ?? [], [user]);
  const hasPropertyAccess = propertyAssignments.length > 0;
  const [properties, setProperties] = useState<Property[]>([]);
  const [walkthroughs, setWalkthroughs] = useState<SiteWalkthrough[]>([]);
  const [intakeSessions, setIntakeSessions] = useState<WalkthroughSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [formData, setFormData] = useState({
    property_id: '',
    scheduled_date: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!hasPropertyAccess) {
        setProperties([]);
        setWalkthroughs([]);
        setIntakeSessions([]);
        setFormData((prev) => ({ ...prev, property_id: '' }));
        return;
      }

      const [propertyData, walkthroughData] = await Promise.all([
        propertyService.getProperties(),
        siteWalkthroughService.getSiteWalkthroughs({ property_ids: propertyAssignments }),
      ]);
      const filteredProperties = propertyData.filter((property) => propertyAssignments.includes(property.id));
      setProperties(filteredProperties);
      setWalkthroughs(walkthroughData);
      const sessionData = await walkthroughSessionService.list(propertyAssignments);
      setIntakeSessions(sessionData.sort((a, b) => new Date(a.scheduledDate).valueOf() - new Date(b.scheduledDate).valueOf()));
      const draft = getSavedWalkthroughDraft();
      if (draft) {
        setFormData({
          property_id: draft.propertyId || '',
          scheduled_date: '',
          notes: draft.summary || '',
        });
        toast.success('Loaded intake details into walkthrough form');
        clearWalkthroughDraft();
      }
    } catch (error) {
      console.error('Failed to load walkthroughs:', error);
      toast.error('Unable to load site walkthroughs');
    } finally {
      setIsLoading(false);
    }
  }, [propertyAssignments, hasPropertyAccess]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!formData.property_id && properties.length > 0) {
      setFormData((prev) => ({ ...prev, property_id: properties[0].id }));
    }
  }, [properties, formData.property_id]);

  const summary = useMemo(() => {
    const total = walkthroughs.length;
    const scheduled = walkthroughs.filter((w) => w.status === 'Scheduled');
    const inProgress = walkthroughs.filter((w) => w.status === 'In Progress');
    const complete = walkthroughs.filter((w) => w.status === 'Complete');
    const criticalFindings = walkthroughs.reduce((count, walkthrough) => {
      return (
        count +
        (walkthrough.findings?.filter((finding) => finding.severity === 'Critical').length || 0)
      );
    }, 0);

    return {
      total,
      scheduled: scheduled.length,
      nextWalkthrough: scheduled[0] || null,
      inProgress: inProgress.length,
      complete: complete.length,
      criticalFindings,
    };
  }, [walkthroughs]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.property_id) nextErrors.property_id = 'Select a property';
    if (!formData.scheduled_date) nextErrors.scheduled_date = 'Pick a date/time';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in the highlighted fields');
      return;
    }

    try {
      setIsScheduling(true);
      await siteWalkthroughService.createSiteWalkthrough({
        property_id: formData.property_id,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        status: 'Scheduled',
        notes: formData.notes,
        priority_list: [],
      });
      toast.success('Walkthrough scheduled');
      setFormData({ property_id: '', scheduled_date: '', notes: '' });
      await loadData();
    } catch (error) {
      console.error('Failed to schedule walkthrough:', error);
      toast.error('Unable to schedule walkthrough');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleStatusUpdate = async (walkthrough: SiteWalkthrough, status: SiteWalkthrough['status']) => {
    try {
      if (walkthrough.status === status) return;
      if (status === 'Complete') {
        await siteWalkthroughService.markAsComplete(walkthrough.id);
      } else {
        const normalizedStatus = (status === 'InProgress' ? 'In Progress' : status) as 'Scheduled' | 'In Progress' | 'Complete';
        await siteWalkthroughService.updateStatus(walkthrough.id, normalizedStatus);
      }
      toast.success(`Walkthrough marked ${status}`);
      await loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Unable to update walkthrough');
    }
  };

  const handleGeneratePriorityList = async (walkthroughId: string) => {
    try {
      const list = await siteWalkthroughService.generatePriorityList(walkthroughId);
      await siteWalkthroughService.updatePriorityList(walkthroughId, list);
      toast.success('Priority list generated');
      await loadData();
    } catch (error) {
      console.error('Failed to generate priority list:', error);
      toast.error('Unable to generate priority list');
    }
  };

  const getPropertyName = (propertyId: string) => properties.find((property) => property.id === propertyId)?.name || 'Property';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#0f2749]/20 border-t-[#0f2749] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading site walkthroughs…</p>
        </div>
      </div>
    );
  }

  if (!hasPropertyAccess) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12">
        <div className="rounded-3xl bg-gradient-to-r from-[#0F1F2D] via-[#0f2749] to-[#1F4B7A] text-white p-8 shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-4">Historic Property Operations</p>
          <h1 className="text-3xl font-heading font-bold">Site Walkthrough Command Center</h1>
          <p className="mt-3 text-white/80 max-w-2xl">
            Assign at least one property to your profile to view or schedule walkthroughs.
          </p>
        </div>
        <div className="border border-dashed border-neutral-300 rounded-2xl p-6 text-center text-neutral-600">
          <p>No property access detected for your account.</p>
          <p className="text-sm mt-2">Please contact an administrator to grant property permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0F1F2D] via-[#0f2749] to-[#1F4B7A] text-white p-8 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-4">Historic Property Operations</p>
            <h1 className="text-4xl font-heading font-bold">Site Walkthrough Command Center</h1>
            <p className="mt-3 text-white/80 max-w-2xl">
              Coordinate field inspections, capture architect-level documentation, and prioritize work for Wallace,
              Woodland, and Paris with a single, brand-driven interface.
            </p>
          </div>
          {summary.nextWalkthrough ? (
            <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-5 min-w-[260px]">
              <p className="text-xs font-semibold tracking-wide text-white/70">Next Walkthrough</p>
              <p className="text-2xl font-heading font-semibold mt-1">
                {getPropertyName(summary.nextWalkthrough.property_id)}
              </p>
              <p className="text-sm text-white/70">
                {new Date(summary.nextWalkthrough.scheduled_date).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </p>
            </div>
          ) : (
            <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-5 min-w-[260px]">
              <p className="text-xs font-semibold tracking-wide text-white/70">Next Walkthrough</p>
              <p className="text-2xl font-heading font-semibold mt-1">Not Scheduled</p>
              <p className="text-sm text-white/70">Schedule the next historic walkthrough to stay ahead.</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-[#0f2749]">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Scheduled</p>
          <p className="text-4xl font-heading font-bold text-[#0f2749]">{summary.scheduled}</p>
          <p className="text-sm text-neutral-500">Walkthroughs awaiting execution</p>
        </div>
        <div className="card p-6 border-l-4 border-[#0f2749]">
          <p className="text-xs uppercase tracking-wide text-neutral-500">In Progress</p>
          <p className="text-4xl font-heading font-bold text-[#0f2749]">{summary.inProgress}</p>
          <p className="text-sm text-neutral-500">Teams currently onsite</p>
        </div>
        <div className="card p-6 border-l-4 border-emerald-500">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Completed</p>
          <p className="text-4xl font-heading font-bold text-emerald-600">{summary.complete}</p>
          <p className="text-sm text-neutral-500">Ready for documentation</p>
        </div>
        <div className="card p-6 border-l-4 border-red-500">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Critical Findings</p>
          <p className="text-4xl font-heading font-bold text-red-600">{summary.criticalFindings}</p>
          <p className="text-sm text-neutral-500">Require PM escalation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Schedule Form */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0f2749]/10 flex items-center justify-center text-[#0f2749]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Schedule Walkthrough</p>
              <p className="text-xl font-heading font-semibold text-neutral-900">New Field Visit</p>
            </div>
          </div>

          <form onSubmit={handleSchedule} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">Property</label>
              <select
                value={formData.property_id}
                onChange={(e) => {
                  setFormData({ ...formData, property_id: e.target.value });
                  if (errors.property_id) setErrors({ ...errors, property_id: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2749] ${
                  errors.property_id ? 'border-red-300' : 'border-neutral-200'
                }`}
              >
                <option value="">Select a property…</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
              {errors.property_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.property_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">Date & Time</label>
              <input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => {
                  setFormData({ ...formData, scheduled_date: e.target.value });
                  if (errors.scheduled_date) setErrors({ ...errors, scheduled_date: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2749] ${
                  errors.scheduled_date ? 'border-red-300' : 'border-neutral-200'
                }`}
              />
              {errors.scheduled_date && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.scheduled_date}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">Focus Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2749]"
                placeholder="Document architect priorities, compliance checks, or safety items to investigate."
              />
            </div>

            <button
              type="submit"
              disabled={isScheduling}
              className="w-full flex items-center justify-center gap-2 bg-[#0f2749] hover:bg-[#0f2542] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {isScheduling ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" /> Scheduling…
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" /> Schedule Walkthrough
                </>
              )}
            </button>
          </form>
        </div>

        {/* Upcoming Timeline */}
        <div className="card p-6 xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Timeline</p>
              <p className="text-xl font-heading font-semibold text-neutral-900">Upcoming & Active Walkthroughs</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Clock className="w-4 h-4" /> Baton Rouge Central Time
            </div>
          </div>

          {walkthroughs.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
              No walkthroughs scheduled yet.
            </div>
          ) : (
            <div className="space-y-4">
              {walkthroughs.map((walkthrough) => (
                <div
                  key={walkthrough.id}
                  className="p-4 border border-neutral-200 rounded-2xl flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0f2749]/10 text-[#0f2749] flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-wide text-neutral-500">{getPropertyName(walkthrough.property_id)}</p>
                      <p className="text-2xl font-heading font-semibold text-neutral-900">
                        {new Date(walkthrough.scheduled_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        <span className="text-base font-normal text-neutral-500">
                          {new Date(walkthrough.scheduled_date).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </span>
                      </p>
                      {walkthrough.notes && (
                        <p className="text-sm text-neutral-600 mt-1">{walkthrough.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col lg:items-end gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge[walkthrough.status]}`}>
                      {walkthrough.status}
                    </span>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <button
                        onClick={() => handleStatusUpdate(walkthrough, 'InProgress')}
                        className="px-3 py-1 rounded-full border border-neutral-200 text-neutral-700 hover:border-[#0f2749] hover:text-[#0f2749] transition-colors"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(walkthrough, 'Complete')}
                        className="px-3 py-1 rounded-full border border-neutral-200 text-neutral-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleGeneratePriorityList(walkthrough.id)}
                        className="px-3 py-1 rounded-full border border-neutral-200 text-neutral-700 hover:border-[#0f2749] hover:text-[#0f2749] transition-colors"
                      >
                        Build Priorities
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {intakeSessions.length > 0 && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Intake Walkthrough Sessions</p>
              <p className="text-xl font-heading font-semibold text-neutral-900">AI-Generated Walkthroughs</p>
            </div>
          </div>
          <div className="space-y-3">
            {intakeSessions.map((session) => {
              const lead = mockLeads.find((l) => l.id === session.leadId);
              return (
                <div key={session.id} className="border border-neutral-200 p-4 text-sm flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900">{(lead as any)?.companyName || 'Lead'}</p>
                    <p className="text-neutral-500">Scheduled {new Date(session.scheduledDate).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge[session.status === 'InProgress' ? 'In Progress' : session.status === 'Complete' ? 'Complete' : 'Scheduled']}`}>
                      {session.status}
                    </span>
                    <Link
                      className="text-xs text-[#0f2749] border border-[#0f2749] px-3 py-1"
                      to={`/walkthroughs/new/${session.leadId}`}
                    >
                      Open Session
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Findings + Priority Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#0f2749]/10 text-[#0f2749] flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Findings Library</p>
              <p className="text-xl font-heading font-semibold text-neutral-900">Site Findings</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {walkthroughs.flatMap((walkthrough) =>
              (walkthrough.findings || []).map((finding, index) => (
                <div key={`${walkthrough.id}-${index}`} className="border border-neutral-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${severityChip[finding.severity]}`}>
                      {finding.severity}
                    </span>
                    <span className="text-xs text-neutral-500">{getPropertyName(walkthrough.property_id)}</span>
                  </div>
                  <p className="mt-3 text-neutral-900 font-medium">{finding.description}</p>
                  {(finding as any).recommended_action && (
                    <p className="text-sm text-neutral-500 mt-2">{(finding as any).recommended_action}</p>
                  )}
                </div>
              ))
            )}
            {walkthroughs.every((walkthrough) => !walkthrough.findings?.length) && (
              <div className="text-center py-8 text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
                No findings logged yet.
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#0f2749]/10 text-[#0f2749] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Priority Lists</p>
              <p className="text-xl font-heading font-semibold text-neutral-900">Property Action Queue</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {walkthroughs.map((walkthrough) => (
              <div key={`${walkthrough.id}-priority`} className="border border-neutral-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-neutral-500">{getPropertyName(walkthrough.property_id)}</p>
                    <p className="text-lg font-heading font-semibold text-neutral-900">
                      {walkthrough.status === 'Complete' ? 'Ready for Action' : walkthrough.status}
                    </p>
                  </div>
                  <button
                    onClick={() => handleGeneratePriorityList(walkthrough.id)}
                    className="text-sm text-[#0f2749] hover:text-[#0f2542] font-semibold"
                  >
                    Refresh List
                  </button>
                </div>
                {walkthrough.priority_list && walkthrough.priority_list.length > 0 ? (
                  <ul className="space-y-2">
                    {walkthrough.priority_list.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" /> {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500">No priority items yet. Generate once findings are logged.</p>
                )}
              </div>
            ))}
            {walkthroughs.length === 0 && (
              <div className="text-center py-8 text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
                Schedule a walkthrough to see priority queues.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
