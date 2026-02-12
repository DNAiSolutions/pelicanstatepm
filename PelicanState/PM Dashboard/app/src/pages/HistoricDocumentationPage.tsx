import { useEffect, useMemo, useState } from 'react';
import { workRequestService } from '../services/workRequestService';
import { historicDocumentationService } from '../services/historicDocumentationService';
import type { HistoricDocumentation, WorkRequest } from '../types';
import { campusService, type Campus } from '../services/campusService';
import {
  Feather,
  PenSquare,
  BookOpen,
  FileText,
  UploadCloud,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function HistoricDocumentationPage() {
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [docs, setDocs] = useState<HistoricDocumentation[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    materials_used: '',
    methods_applied: '',
    architect_guidance: '',
    compliance_notes: '',
    photo_urls: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const doc = docs.find((d) => d.work_request_id === selectedId);
    if (doc) {
      setFormData({
        materials_used: doc.materials_used || '',
        methods_applied: doc.methods_applied || '',
        architect_guidance: doc.architect_guidance || '',
        compliance_notes: doc.compliance_notes || '',
        photo_urls: doc.photo_urls?.join(', ') || '',
      });
    } else {
      setFormData({
        materials_used: '',
        methods_applied: '',
        architect_guidance: '',
        compliance_notes: '',
        photo_urls: '',
      });
    }
    setErrors({});
  }, [selectedId, docs]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [wrData, docData, campusData] = await Promise.all([
        workRequestService.getWorkRequests({ is_historic: true }),
        historicDocumentationService.getHistoricDocumentation(),
        campusService.getCampuses(),
      ]);
      setWorkRequests(wrData);
      setDocs(docData);
      setCampuses(campusData);
      if (!selectedId && wrData.length > 0) {
        setSelectedId(wrData[0].id);
      }
    } catch (error) {
      console.error('Failed to load historic docs:', error);
      toast.error('Unable to load documentation');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRequest = useMemo(
    () => workRequests.find((wr) => wr.id === selectedId) || null,
    [selectedId, workRequests]
  );

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedId) nextErrors.work_request_id = 'Select a work request';
    if (!formData.materials_used.trim()) nextErrors.materials_used = 'Required for historic documentation';
    if (!formData.methods_applied.trim()) nextErrors.methods_applied = 'Document restoration methods';
    if (!formData.architect_guidance.trim()) nextErrors.architect_guidance = 'Capture architect guidance';
    if (!formData.compliance_notes.trim()) nextErrors.compliance_notes = 'Add compliance notes';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error('Please complete the highlighted fields');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        work_request_id: selectedId,
        materials_used: formData.materials_used,
        methods_applied: formData.methods_applied,
        architect_guidance: formData.architect_guidance,
        compliance_notes: formData.compliance_notes,
        photo_urls: formData.photo_urls
          .split(',')
          .map((url) => url.trim())
          .filter(Boolean),
      };

      const existing = docs.find((doc) => doc.work_request_id === selectedId);

      if (existing) {
        await historicDocumentationService.updateHistoricDocumentation(existing.id, payload as any);
        toast.success('Historic documentation updated');
      } else {
        await historicDocumentationService.createHistoricDocumentation(payload as any);
        toast.success('Historic documentation created');
      }

      await loadData();
    } catch (error) {
      console.error('Failed to save documentation:', error);
      toast.error('Unable to save historic documentation');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#143352]/20 border-t-[#143352] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading historic documentation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-3xl bg-[#143352] text-white p-8 shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-4">Historic Stewardship</p>
            <h1 className="text-4xl font-heading font-bold">Historic Documentation Ledger</h1>
            <p className="mt-3 text-white/80 max-w-3xl">
              Capture materials, methods, and architect directives for each historic work request—ensuring compliance
              with state historic preservation standards down to nail type.
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-5 min-w-[260px]">
            <p className="text-xs font-semibold tracking-wide text-white/70">Historic Work Requests</p>
            <p className="text-4xl font-heading font-semibold">{workRequests.length}</p>
            <p className="text-sm text-white/70">
              {workRequests.filter((wr) => wr.is_historic).length} active projects across campuses
            </p>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Selector + Summary */}
        <div className="space-y-6 xl:col-span-1">
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-[#143352] border border-[#143352]/20 flex items-center justify-center">
                <Feather className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Select Work Request</p>
                <p className="text-xl font-heading font-semibold text-neutral-900">Historic Intake</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-900 mb-2 block">Historic Request</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#143352]"
              >
                {workRequests.length === 0 && <option value="">No historic requests available</option>}
                {workRequests.map((wr) => (
                  <option key={wr.id} value={wr.id}>
                    {wr.request_number} — {wr.property}
                  </option>
                ))}
              </select>
              {errors.work_request_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.work_request_id}
                </p>
              )}
            </div>

            {selectedRequest && (
              <div className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Campus</p>
                    <p className="text-lg font-heading font-semibold text-neutral-900">
                      {campuses.find((c) => c.id === selectedRequest.campus_id)?.name || 'Campus'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#143352]/10 text-[#143352]">
                      {selectedRequest.priority} Priority
                  </span>
                </div>
                <p className="text-sm text-neutral-600">{selectedRequest.description}</p>
                {selectedRequest.scope_of_work && (
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mt-3">Scope</p>
                )}
                <p className="text-sm text-neutral-700">{selectedRequest.scope_of_work}</p>
              </div>
            )}
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#143352]/10 text-[#143352] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Documentation Summary</p>
                <p className="text-xl font-heading font-semibold text-neutral-900">Archive Snapshot</p>
              </div>
            </div>

            <div className="space-y-3">
              {docs.map((doc) => {
                const wr = workRequests.find((w) => w.id === doc.work_request_id);
                return (
                  <div key={doc.id} className="flex items-center justify-between border border-neutral-200 rounded-2xl p-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{wr?.request_number}</p>
                      <p className="text-xs text-neutral-500">Updated {new Date(doc.updated_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Logged
                    </span>
                  </div>
                );
              })}
              {docs.length === 0 && <p className="text-sm text-neutral-500">No documentation stored yet.</p>}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card p-6 space-y-6 xl:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#143352]/10 text-[#143352] flex items-center justify-center">
              <PenSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Documentation Ledger</p>
              <p className="text-xl font-heading font-semibold text-neutral-900">Capture Details</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">Materials Used</label>
                <textarea
                  value={formData.materials_used}
                  onChange={(e) => {
                    setFormData({ ...formData, materials_used: e.target.value });
                    if (errors.materials_used) setErrors({ ...errors, materials_used: '' });
                  }}
                  rows={5}
                  placeholder="Document lumber species, fasteners, finishes, hardware—down to nail types."
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#143352] ${
                    errors.materials_used ? 'border-red-300' : 'border-neutral-200'
                  }`}
                />
                {errors.materials_used && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.materials_used}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">Methods Applied</label>
                <textarea
                  value={formData.methods_applied}
                  onChange={(e) => {
                    setFormData({ ...formData, methods_applied: e.target.value });
                    if (errors.methods_applied) setErrors({ ...errors, methods_applied: '' });
                  }}
                  rows={5}
                  placeholder="Describe installation techniques, preservation methods, and sequence of work."
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#143352] ${
                    errors.methods_applied ? 'border-red-300' : 'border-neutral-200'
                  }`}
                />
                {errors.methods_applied && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.methods_applied}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">Architect Guidance</label>
                <textarea
                  value={formData.architect_guidance}
                  onChange={(e) => {
                    setFormData({ ...formData, architect_guidance: e.target.value });
                    if (errors.architect_guidance) setErrors({ ...errors, architect_guidance: '' });
                  }}
                  rows={4}
                  placeholder="Summarize directives from architects or preservation boards."
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#143352] ${
                    errors.architect_guidance ? 'border-red-300' : 'border-neutral-200'
                  }`}
                />
                {errors.architect_guidance && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.architect_guidance}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">Compliance Notes</label>
                <textarea
                  value={formData.compliance_notes}
                  onChange={(e) => {
                    setFormData({ ...formData, compliance_notes: e.target.value });
                    if (errors.compliance_notes) setErrors({ ...errors, compliance_notes: '' });
                  }}
                  rows={4}
                  placeholder="Document inspections, SHPO approvals, tax credit requirements, or permit notes."
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#143352] ${
                    errors.compliance_notes ? 'border-red-300' : 'border-neutral-200'
                  }`}
                />
                {errors.compliance_notes && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {errors.compliance_notes}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">Photo URLs</label>
              <textarea
                value={formData.photo_urls}
                onChange={(e) => setFormData({ ...formData, photo_urls: e.target.value })}
                rows={3}
                placeholder="https://photo1.jpg, https://detail-shot.png"
                className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#143352]"
              />
              <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                <Camera className="w-4 h-4" /> Separate multiple URLs with commas.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 min-w-[220px] bg-[#143352] hover:bg-[#0f2542] text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <UploadCloud className="w-5 h-5 animate-spin" /> Saving
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" /> Save Documentation
                  </>
                )}
              </button>
              {selectedId && (
                <button
                  type="button"
                  onClick={() => setSelectedId('')}
                  className="min-w-[150px] border border-neutral-200 text-neutral-700 rounded-2xl px-4 py-3 font-semibold hover:text-[#143352] hover:border-[#143352] transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
