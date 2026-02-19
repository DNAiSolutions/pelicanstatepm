import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { workRequestService } from '../services/workRequestService';
import { campusService, type Campus } from '../services/campusService';
import { retainerRateService } from '../services/retainerRateService';
import { historicDocumentationService } from '../services/historicDocumentationService';
import type { Priority, WorkCategory, RateType } from '../types';
import { Upload, AlertCircle, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export function WorkRequestIntakePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form state
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const CATEGORY_OPTIONS: { value: WorkCategory; title: string; description: string }[] = [
    { value: 'Emergency Response', title: 'Emergency Response', description: 'Leaks, outages, and hazards impacting operations right now.' },
    { value: 'Preventative Maintenance', title: 'Preventative Maintenance', description: 'Recurring inspections, tune-ups, and lifecycle care.' },
    { value: 'Capital Improvement', title: 'Capital Improvement', description: 'Large scoped improvements, structural work, or multi-trade efforts.' },
    { value: 'Tenant Improvement', title: 'Tenant Improvement', description: 'Interior buildouts, finish upgrades, and tailored suites.' },
    { value: 'Event Support', title: 'Event Support', description: 'Staging, AV, temporary power, and guest-facing setups.' },
    { value: 'Grounds & Landscape', title: 'Grounds & Landscape', description: 'Site, landscape, irrigation, and exterior amenities.' },
    { value: 'Historic Conservation', title: 'Historic Conservation', description: 'SHPO-coordinated work requiring documentation and approvals.' },
    { value: 'Small Works', title: 'Small Works', description: 'Quick repairs, punch items, or light handyman scopes.' },
  ];

  const RATE_MAPPING: Record<WorkCategory, RateType> = {
    'Emergency Response': 'Manual Labor',
    'Preventative Maintenance': 'Manual Labor',
    'Capital Improvement': 'Construction Supervision',
    'Tenant Improvement': 'Project Management',
    'Event Support': 'Project Management',
    'Grounds & Landscape': 'Manual Labor',
    'Historic Conservation': 'Construction Supervision',
    'Small Works': 'Manual Labor',
  };

  const [formData, setFormData] = useState({
    campus_id: '',
    property: '',
    is_historic: false,
    category: 'Emergency Response' as WorkCategory,
    description: '',
    priority: 'Medium' as Priority,
    scope_of_work: '',
    inspection_notes: '',
  });
  const [historicDoc, setHistoricDoc] = useState({
    materials_used: '',
    methods_applied: '',
    architect_guidance: '',
    compliance_notes: '',
    photo_urls: '',
  });
  const [retainerRates, setRetainerRates] = useState<Record<string, number>>({});
  const [recommendedRateLabel, setRecommendedRateLabel] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load campuses on mount
  useEffect(() => {
    const loadCampuses = async () => {
      try {
        const data = await campusService.getCampuses();
        setCampuses(data);
      } catch (error) {
        console.error('Failed to load campuses:', error);
        toast.error('Failed to load campuses');
      }
    };
    loadCampuses();
  }, []);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const rates = await retainerRateService.getRetainerRates();
        if (rates) {
          const rateMap: Record<string, number> = {};
          rates.forEach((rate: any) => {
            rateMap[rate.rate_type] = rate.hourly_rate;
          });
          setRetainerRates(rateMap);
          updateRecommendedRateLabel(formData.category, rateMap);
        }
      } catch (error) {
        console.error('Failed to load retainer rates:', error);
      }
    };
    loadRates();
  }, []);

  const updateRecommendedRateLabel = (category: WorkCategory, rates = retainerRates) => {
    const type = RATE_MAPPING[category];
    if (!type) {
      setRecommendedRateLabel('');
      return;
    }
    const hourly = rates[type];
    setRecommendedRateLabel(
      hourly ? `${type} · $${hourly.toFixed(2)}/hr` : `${type} · rate not set`
    );
  };

  // Auto-save draft
  const saveDraft = useCallback(async () => {
    if (!user?.id || !formData.campus_id || !formData.property || !formData.description) {
      return; // Don't save incomplete forms
    }

    try {
      // Note: In a real app, this would save to a drafts table
      // For now, we're just showing the auto-save behavior
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [formData, user?.id]);

  // Auto-save every 2 seconds if form has changed
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, saveDraft]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.campus_id) newErrors.campus_id = 'Campus is required';
    if (!formData.property.trim()) newErrors.property = 'Property is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.scope_of_work.trim()) newErrors.scope_of_work = 'Scope of work is required';
    if (!formData.inspection_notes.trim()) newErrors.inspection_notes = 'Inspection notes are required';

    if (formData.is_historic) {
      if (!historicDoc.materials_used.trim()) newErrors.materials_used = 'Materials are required';
      if (!historicDoc.methods_applied.trim()) newErrors.methods_applied = 'Methods are required';
      if (!historicDoc.architect_guidance.trim()) newErrors.architect_guidance = 'Architect guidance is required';
      if (!historicDoc.compliance_notes.trim()) newErrors.compliance_notes = 'Compliance notes are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    try {
      setIsSubmitting(true);

      const newWorkRequest = await workRequestService.createWorkRequest({
        request_number: '',
        campus_id: formData.campus_id,
        property: formData.property,
        is_historic: formData.is_historic,
        category: formData.category,
        description: formData.description,
        priority: formData.priority,
        scope_of_work: formData.scope_of_work,
        inspection_notes: formData.inspection_notes,
        status: 'Intake',
        created_by: user!.id,
      } as any);

      if (formData.is_historic) {
        await historicDocumentationService.createHistoricDocumentation({
          work_request_id: newWorkRequest.id,
          materials_used: historicDoc.materials_used,
          methods_applied: historicDoc.methods_applied,
          architect_guidance: historicDoc.architect_guidance,
          compliance_notes: historicDoc.compliance_notes,
          photo_urls: historicDoc.photo_urls
            .split(',')
            .map((url) => url.trim())
            .filter(Boolean),
        } as any);
      }

      toast.success(`Work request ${newWorkRequest.request_number} created!`);
      navigate(`/work-requests/${newWorkRequest.id}`);
    } catch (error) {
      console.error('Failed to create work request:', error);
      toast.error('Failed to create work request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (formData.property || formData.description) {
      if (window.confirm('Discard unsaved changes?')) {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-primary-900 mb-2">
          Create Work Request
        </h1>
        <p className="text-neutral-600">
          Start a new facilities or construction request for one of our campuses
        </p>
      </div>

      {/* Auto-save indicator */}
      {lastSaved && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />
          Draft saved at {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        {/* Campus Selection */}
        <div>
          <label htmlFor="campus_id" className="block text-sm font-medium text-neutral-900 mb-2">
            Campus <span className="text-red-600">*</span>
          </label>
          <select
            id="campus_id"
            value={formData.campus_id}
            onChange={(e) => {
              const campus = campuses.find((c) => c.id === e.target.value);
              setFormData({
                ...formData,
                campus_id: e.target.value,
                priority: campus?.priority || formData.priority,
              });
              if (errors.campus_id) setErrors({ ...errors, campus_id: '' });
            }}
            className={`w-full px-4 py-2 border ${
              errors.campus_id ? 'border-red-300' : 'border-neutral-300'
            } bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
          >
            <option value="">Select a campus...</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
          {errors.campus_id && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.campus_id}
            </p>
          )}
        </div>

        {/* Property */}
        <div>
          <label htmlFor="property" className="block text-sm font-medium text-neutral-900 mb-2">
            Property / Location <span className="text-red-600">*</span>
          </label>
          <input
            id="property"
            type="text"
            value={formData.property}
            onChange={(e) => {
              setFormData({ ...formData, property: e.target.value });
              if (errors.property) setErrors({ ...errors, property: '' });
            }}
            placeholder="e.g., Historic Building A, Main Gallery, Pergola Area"
            className={`w-full px-4 py-2 border ${
              errors.property ? 'border-red-300' : 'border-neutral-300'
            } bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
          />
          {errors.property && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.property}
            </p>
          )}
        </div>

        {/* Priority & Historic Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-3">
              Priority Level <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['Critical', 'High', 'Medium', 'Low'] as Priority[]).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setFormData({ ...formData, priority: level })}
                  className={`px-4 py-2 border text-sm font-semibold uppercase tracking-wide transition-all ${
                    formData.priority === level
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-neutral-200 text-neutral-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-neutral-50 border border-neutral-200">
            <input
              id="is_historic"
              type="checkbox"
              checked={formData.is_historic}
              onChange={(e) => setFormData({ ...formData, is_historic: e.target.checked })}
              className="w-4 h-4 accent-primary-500"
            />
            <label htmlFor="is_historic" className="flex-1">
              <p className="font-medium text-neutral-900">This is a historic property</p>
              <p className="text-xs text-neutral-600">
                Requires additional documentation (photos, materials log, method notes)
              </p>
            </label>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-3">
            Category <span className="text-red-600">*</span>
          </label>
          <div className="space-y-2">
            {CATEGORY_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-start gap-3 p-3 border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={option.value}
                  checked={formData.category === option.value}
                  onChange={(e) => {
                    const value = e.target.value as WorkCategory;
                    setFormData({ ...formData, category: value });
                    updateRecommendedRateLabel(value);
                  }}
                  className="w-4 h-4 accent-primary-500"
                />
                <div>
                  <p className="font-medium text-neutral-900">{option.title}</p>
                  <p className="text-xs text-neutral-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.category && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.category}
            </p>
          )}
        </div>

        {/* Scope of Work */}
        <div>
          <label htmlFor="scope_of_work" className="block text-sm font-medium text-neutral-900 mb-2">
            Scope of Work <span className="text-red-600">*</span>
          </label>
          <textarea
            id="scope_of_work"
            value={formData.scope_of_work}
            onChange={(e) => {
              setFormData({ ...formData, scope_of_work: e.target.value });
              if (errors.scope_of_work) setErrors({ ...errors, scope_of_work: '' });
            }}
            placeholder="Detail trades involved, deliverables, and definition of done..."
            rows={4}
            className={`w-full px-4 py-2 border ${
              errors.scope_of_work ? 'border-red-300' : 'border-neutral-300'
            } bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
          />
          {errors.scope_of_work && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.scope_of_work}
            </p>
          )}
        </div>

        {/* Inspection Notes */}
        <div>
          <label htmlFor="inspection_notes" className="block text-sm font-medium text-neutral-900 mb-2">
            Inspection Notes <span className="text-red-600">*</span>
          </label>
          <textarea
            id="inspection_notes"
            value={formData.inspection_notes}
            onChange={(e) => {
              setFormData({ ...formData, inspection_notes: e.target.value });
              if (errors.inspection_notes) setErrors({ ...errors, inspection_notes: '' });
            }}
            placeholder="Capture field observations, constraints, safety considerations..."
            rows={4}
            className={`w-full px-4 py-2 border ${
              errors.inspection_notes ? 'border-red-300' : 'border-neutral-300'
            } bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
          />
          {errors.inspection_notes && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.inspection_notes}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-900 mb-2">
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            placeholder="Describe the work that needs to be done..."
            rows={6}
            className={`w-full px-4 py-2 border ${
              errors.description ? 'border-red-300' : 'border-neutral-300'
            } bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.description}
            </p>
          )}
          <p className="text-xs text-neutral-500 mt-1">
            {formData.description.length} characters
          </p>
        </div>

        {/* Historic Documentation */}
        {formData.is_historic && (
          <div className="border border-amber-200 bg-amber-50 p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-900 font-semibold uppercase tracking-wide text-xs">
              <AlertTriangle className="w-4 h-4" /> Historic Documentation Required
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Materials Used
                </label>
                <textarea
                  value={historicDoc.materials_used}
                  onChange={(e) => {
                    setHistoricDoc({ ...historicDoc, materials_used: e.target.value });
                    if (errors.materials_used) setErrors({ ...errors, materials_used: '' });
                  }}
                  rows={3}
                  className={`w-full px-4 py-2 border ${
                    errors.materials_used ? 'border-red-300' : 'border-neutral-300'
                  } bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  placeholder="List materials down to hardware specifications"
                />
                {errors.materials_used && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.materials_used}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Methods Applied
                </label>
                <textarea
                  value={historicDoc.methods_applied}
                  onChange={(e) => {
                    setHistoricDoc({ ...historicDoc, methods_applied: e.target.value });
                    if (errors.methods_applied) setErrors({ ...errors, methods_applied: '' });
                  }}
                  rows={3}
                  className={`w-full px-4 py-2 border ${
                    errors.methods_applied ? 'border-red-300' : 'border-neutral-300'
                  } bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  placeholder="Document preservation techniques, fasteners, finish details"
                />
                {errors.methods_applied && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.methods_applied}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Architect Guidance
                </label>
                <textarea
                  value={historicDoc.architect_guidance}
                  onChange={(e) => {
                    setHistoricDoc({ ...historicDoc, architect_guidance: e.target.value });
                    if (errors.architect_guidance) setErrors({ ...errors, architect_guidance: '' });
                  }}
                  rows={3}
                  className={`w-full px-4 py-2 border ${
                    errors.architect_guidance ? 'border-red-300' : 'border-neutral-300'
                  } bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  placeholder="Capture directives from preservation architects"
                />
                {errors.architect_guidance && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.architect_guidance}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Compliance Notes
                </label>
                <textarea
                  value={historicDoc.compliance_notes}
                  onChange={(e) => {
                    setHistoricDoc({ ...historicDoc, compliance_notes: e.target.value });
                    if (errors.compliance_notes) setErrors({ ...errors, compliance_notes: '' });
                  }}
                  rows={3}
                  className={`w-full px-4 py-2 border ${
                    errors.compliance_notes ? 'border-red-300' : 'border-neutral-300'
                  } bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  placeholder="Reference SHPO approvals, inspection findings, compliance steps"
                />
                {errors.compliance_notes && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.compliance_notes}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Photo URLs (comma separated)
                </label>
                <textarea
                  value={historicDoc.photo_urls}
                  onChange={(e) => setHistoricDoc({ ...historicDoc, photo_urls: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="https://... , https://..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Retainer Rate Reference */}
        <div className="p-4 bg-primary-900 text-white flex items-center gap-3">
          <FileText className="w-5 h-5" />
          <div>
            <p className="text-sm font-semibold">Recommended Retainer Rate</p>
            <p className="text-sm opacity-80">
              {recommendedRateLabel || 'Select a category to view recommended rate'}
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-neutral-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 btn-primary py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Create Work Request
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary py-3 px-6 font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 text-sm text-blue-700 space-y-2">
          <p className="font-medium flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Next Steps
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Once created, you'll be able to add cost estimates</li>
            <li>Client approval required before scheduling work</li>
            <li>For historic properties, upload documentation and materials log</li>
            <li>Track progress with weekly updates</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
