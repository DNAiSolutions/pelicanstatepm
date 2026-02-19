import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  mockCampuses,
  mockContacts,
  LEAD_NEXT_STEP_LABELS,
  type IntakeChannel,
  type Priority,
  type Lead,
  type Contact,
} from '../../data/pipeline';
import { intakeDecisionService } from '../../services/intakeDecisionService';
import { leadService, type LeadIntakeFormInput } from '../../services/leadService';
import { saveWalkthroughDraftFromLead } from '../../services/walkthroughDraftService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type LeadIntakeModalProps = {
  open: boolean;
  onClose: () => void;
  mode?: 'internal' | 'client';
  defaultCompany?: string;
  defaultContact?: { name?: string; email?: string; phone?: string };
  defaultCampusId?: string;
  defaultProjectId?: string;
  onCreated?: (lead: Lead) => void;
  onLeadUpdated?: (lead: Lead) => void;
};

type LeadIntakeFormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  campusId: string;
  issueSummary: string;
  jobAddress: string;
  urgency: Priority;
  accessNotes: string;
  intakeChannel: IntakeChannel;
  estimatedValue: number;
  notes: string;
  preferredChannel: 'Email' | 'Phone' | 'Text';
  handledBy: string;
  callSource: string;
  campusMode: 'existing' | 'new';
  newCampusName: string;
  newCampusFunding: string;
  newCampusPriority: Priority;
};

const channels: { label: string; value: IntakeChannel }[] = [
  { label: 'Phone Call', value: 'Phone' },
  { label: 'Internal Note', value: 'Internal' },
  { label: 'Client Portal', value: 'ClientPortal' },
  { label: 'Web Form', value: 'WebForm' },
  { label: 'Email', value: 'Email' },
];

const urgencyOptions: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

export function LeadIntakeModal({
  open,
  onClose,
  mode = 'internal',
  defaultCompany,
  defaultContact,
  defaultCampusId,
  defaultProjectId,
  onCreated,
  onLeadUpdated,
}: LeadIntakeModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [attachmentsInput, setAttachmentsInput] = useState('');
  const [successLead, setSuccessLead] = useState<Lead | null>(null);
  const [step, setStep] = useState(1);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [walkthroughDate, setWalkthroughDate] = useState('');
  const [walkthroughNotes, setWalkthroughNotes] = useState('');
  const navigate = useNavigate();
  const buildInitialForm = useCallback((): LeadIntakeFormState => ({
    companyName: defaultCompany || '',
    contactName: defaultContact?.name || '',
    email: defaultContact?.email || '',
    phone: defaultContact?.phone || '',
    campusId: defaultCampusId || mockCampuses[0]?.id || '',
    issueSummary: '',
    jobAddress: '',
    urgency: 'Medium',
    accessNotes: '',
    intakeChannel: mode === 'client' ? ('ClientPortal' as IntakeChannel) : 'Phone',
    estimatedValue: 25000,
    notes: '',
    preferredChannel: 'Email',
    handledBy: '',
    callSource: '',
    campusMode: 'existing',
    newCampusName: '',
    newCampusFunding: '',
    newCampusPriority: 'Medium',
  }), [defaultCampusId, defaultCompany, defaultContact, mode]);
  const [form, setForm] = useState<LeadIntakeFormState>(buildInitialForm);

  const decisionPreview = useMemo(() => {
    if (!form.issueSummary.trim()) return null;
    return intakeDecisionService.evaluate({ issueSummary: form.issueSummary, urgency: form.urgency, intakeChannel: form.intakeChannel });
  }, [form.issueSummary, form.urgency, form.intakeChannel]);

  const duplicateContact = useMemo(() => {
    const normalizedEmail = form.email.trim().toLowerCase();
    const normalizedPhone = form.phone ? form.phone.replace(/[^0-9]/g, '') : '';
    return mockContacts.find((contact) => {
      if (contact.id === selectedContactId) return false;
      if (normalizedEmail && contact.email.toLowerCase() === normalizedEmail) return true;
      if (normalizedPhone && contact.phone.replace(/[^0-9]/g, '') === normalizedPhone) return true;
      return false;
    });
  }, [form.email, form.phone, selectedContactId]);

  const selectedContact: Contact | undefined = useMemo(() => {
    if (selectedContactId) {
      return mockContacts.find((contact) => contact.id === selectedContactId);
    }
    return undefined;
  }, [selectedContactId]);

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm());
      setAttachmentsInput('');
      setAttachmentFiles([]);
      setSubmitting(false);
      setSuccessLead(null);
      setStep(1);
      setWalkthroughDate('');
      setWalkthroughNotes('');
      if (defaultContact) {
        const existing = mockContacts.find((contact) => contact.email === defaultContact.email);
        setSelectedContactId(existing?.id || '');
      } else {
        setSelectedContactId('');
      }
    }
  }, [open, buildInitialForm, defaultContact]);

  const resetState = () => {
    setForm(buildInitialForm());
    setAttachmentsInput('');
    setAttachmentFiles([]);
    setSubmitting(false);
    setSuccessLead(null);
    setStep(1);
    setSelectedContactId(defaultContact ? selectedContactId : '');
    setWalkthroughDate('');
    setWalkthroughNotes('');
  };

  const closeModal = () => {
    resetState();
    onClose();
  };

  if (!open) return null;

  useEffect(() => {
    if (selectedContact) {
      setForm((prev) => ({
        ...prev,
        companyName: selectedContact.company,
        contactName: selectedContact.name,
        email: selectedContact.email,
        phone: selectedContact.phone,
        campusId: selectedContact.campusId || prev.campusId,
        preferredChannel: selectedContact.preferredChannel || prev.preferredChannel,
      }));
    }
  }, [selectedContact]);

  const canProceedStep1 = Boolean(form.companyName && form.contactName && form.email && form.phone);
  const canProceedStep2 = Boolean(form.issueSummary.trim().length > 5);

  const handleSubmit = async () => {
    try {
      if (form.campusMode === 'new' && !form.newCampusName.trim()) {
        toast.error('Enter a campus name');
        return undefined;
      }
      setSubmitting(true);
      const fileNames = attachmentFiles.map((file) => `file:${file.name}`);
      const manualAttachments = attachmentsInput
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      let campusId = form.campusId;
      if (form.campusMode === 'new') {
        const newCampusId = `campus-${form.newCampusName.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
        campusId = newCampusId;
        mockCampuses.push({
          id: newCampusId,
          name: form.newCampusName.trim(),
          fundingSource: form.newCampusFunding.trim() || 'Client Provided',
          priority: form.newCampusPriority,
        });
      }
      const payload: LeadIntakeFormInput = {
        companyName: form.companyName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        campusId,
        projectId: defaultProjectId,
        issueSummary: form.issueSummary,
        jobAddress: form.jobAddress,
        urgency: form.urgency,
        accessNotes: form.accessNotes,
        attachments: [...fileNames, ...manualAttachments],
        intakeChannel: form.intakeChannel,
        estimatedValue: form.estimatedValue,
        notes: form.notes,
        recordedById: mode === 'internal' ? form.handledBy || form.contactName : undefined,
        preferredChannel: form.preferredChannel,
        callSource: form.callSource,
        handledBy: form.handledBy,
        submissionSource: mode === 'client' ? 'Web' : 'Internal',
      };
      const lead = await leadService.createFromIntake(payload);
      setSuccessLead(lead);
      onCreated?.(lead);
      onLeadUpdated?.(lead);
      toast.success('Intake captured');
      return lead;
    } catch (error) {
      toast.error('Unable to submit intake');
      return undefined;
    } finally {
      setSubmitting(false);
    }
  };

  const handleWizardSubmit = async (action?: string) => {
    if (action === 'walkthrough' && !walkthroughDate) {
      toast.error('Select a walkthrough date/time');
      return;
    }
    const lead = await handleSubmit();
    if (!lead) return;
    if (action === 'walkthrough') {
      const scheduled = await leadService.scheduleWalkthrough(lead.id, { date: walkthroughDate, notes: walkthroughNotes });
      if (scheduled) {
        setSuccessLead(scheduled);
        saveWalkthroughDraftFromLead(scheduled);
        onLeadUpdated?.(scheduled);
        closeModal();
        navigate(`/walkthroughs/new/${scheduled.id}`);
      }
    } else if (action === 'nurture') {
      toast.success('Nurture sequence starting');
    } else if (action === 'convert') {
      navigate('/leads');
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center gap-4 px-6 py-3 border-b border-neutral-100 text-sm">
      {[1, 2, 3].map((num) => (
        <div key={num} className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
              step === num ? 'bg-[#143352] text-white' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            {num}
          </div>
          <span className="text-xs text-neutral-500">
            {num === 1 && 'Contact'}
            {num === 2 && 'Issue'}
            {num === 3 && 'Next Step'}
          </span>
        </div>
      ))}
    </div>
  );

  const contactStep = (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">Existing Contact</label>
          <select
            value={selectedContactId}
            onChange={(event) => setSelectedContactId(event.target.value)}
            className="border border-neutral-300 px-3 py-2 w-full"
          >
            <option value="">Select contact…</option>
            {mockContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} — {contact.company}
              </option>
            ))}
          </select>
          {selectedContactId && (
            <button
              type="button"
              onClick={() => setSelectedContactId('')}
              className="text-xs text-[#143352] underline"
            >
              Clear selection
            </button>
          )}
          {selectedContact && (
            <p className="text-xs text-neutral-500">Fields below auto-filled; edit as needed.</p>
          )}
        </div>
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            placeholder="Company / Organization"
            className="border border-neutral-300 px-3 py-2"
          />
          <input
            required
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            placeholder="Primary Contact"
            className="border border-neutral-300 px-3 py-2"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="border border-neutral-300 px-3 py-2"
          />
          <input
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone"
            className="border border-neutral-300 px-3 py-2"
          />
        <select
          value={form.preferredChannel}
          onChange={(e) => setForm({ ...form, preferredChannel: e.target.value as 'Email' | 'Phone' | 'Text' })}
          className="border border-neutral-300 px-3 py-2"
        >
          <option value="Email">Prefers Email</option>
          <option value="Phone">Prefers Phone</option>
          <option value="Text">Prefers Text</option>
        </select>
        <div className="md:col-span-2 flex flex-col gap-2">
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            <label className="flex items-center gap-2">
              <input type="radio" name="campus-mode" value="existing" checked={form.campusMode === 'existing'} onChange={(e) => setForm({ ...form, campusMode: e.target.value as 'existing' | 'new' })} />
              Existing Campus
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="campus-mode" value="new" checked={form.campusMode === 'new'} onChange={(e) => setForm({ ...form, campusMode: e.target.value as 'existing' | 'new' })} />
              Add New Campus
            </label>
          </div>
          {form.campusMode === 'existing' ? (
            <select
              value={form.campusId}
              onChange={(e) => setForm({ ...form, campusId: e.target.value })}
              className="border border-neutral-300 px-3 py-2"
            >
              {mockCampuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                value={form.newCampusName}
                onChange={(e) => setForm({ ...form, newCampusName: e.target.value })}
                placeholder="Campus name"
                className="border border-neutral-300 px-3 py-2"
              />
              <input
                value={form.newCampusFunding}
                onChange={(e) => setForm({ ...form, newCampusFunding: e.target.value })}
                placeholder="Funding source"
                className="border border-neutral-300 px-3 py-2"
              />
              <select
                value={form.newCampusPriority}
                onChange={(e) => setForm({ ...form, newCampusPriority: e.target.value as Priority })}
                className="border border-neutral-300 px-3 py-2"
              >
                {(['Critical', 'High', 'Medium', 'Low'] as Priority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {mode === 'internal' && (
          <select
            value={form.intakeChannel}
            onChange={(e) => setForm({ ...form, intakeChannel: e.target.value as IntakeChannel })}
            className="border border-neutral-300 px-3 py-2"
          >
            {channels.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </select>
        )}
        </div>
      </div>
      {duplicateContact && (
        <div className="flex items-center justify-between text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
          <span>Contact appears to exist ({duplicateContact.name}).</span>
          <button type="button" onClick={() => setSelectedContactId(duplicateContact.id)} className="text-amber-900 underline">
            Use existing
          </button>
        </div>
      )}
      {mode === 'internal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.handledBy}
            onChange={(e) => setForm({ ...form, handledBy: e.target.value })}
            placeholder="Call handled by"
            className="border border-neutral-300 px-3 py-2"
          />
          <input
            value={form.callSource}
            onChange={(e) => setForm({ ...form, callSource: e.target.value })}
            placeholder="Call source / referral"
            className="border border-neutral-300 px-3 py-2"
          />
        </div>
      )}
    </section>
  );

  const issueStep = (
    <section className="space-y-4">
      <textarea
        required
        value={form.issueSummary}
        onChange={(e) => setForm({ ...form, issueSummary: e.target.value })}
        placeholder="What’s happening? Describe the issue or project request."
        className="border border-neutral-300 px-3 py-2 w-full"
        rows={4}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={form.jobAddress}
          onChange={(e) => setForm({ ...form, jobAddress: e.target.value })}
          placeholder="Address / Campus"
          className="border border-neutral-300 px-3 py-2"
        />
        <select
          value={form.urgency}
          onChange={(e) => setForm({ ...form, urgency: e.target.value as Priority })}
          className="border border-neutral-300 px-3 py-2"
        >
          {urgencyOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={form.accessNotes}
        onChange={(e) => setForm({ ...form, accessNotes: e.target.value })}
        placeholder="Access constraints, security, or scheduling notes"
        className="border border-neutral-300 px-3 py-2 w-full"
        rows={2}
      />
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.3em] text-neutral-500">Attachments</label>
        <input
          type="file"
          multiple
          onChange={(event) => setAttachmentFiles(Array.from(event.target.files || []))}
          className="w-full border border-dashed border-neutral-300 px-3 py-2"
          accept="image/*,.pdf,.doc,.docx"
        />
        {attachmentFiles.length > 0 && (
          <ul className="text-xs text-neutral-600 list-disc list-inside">
            {attachmentFiles.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
        <textarea
          value={attachmentsInput}
          onChange={(e) => setAttachmentsInput(e.target.value)}
          placeholder="Paste attachment URLs or notes (one per line)"
          className="border border-neutral-300 px-3 py-2 w-full"
          rows={2}
        />
      </div>
      {mode === 'internal' && (
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Internal notes (who took the call, nurture instructions, etc.)"
          className="border border-neutral-300 px-3 py-2 w-full"
          rows={2}
        />
      )}
    </section>
  );

  const nextStepPanel = (
    <section className="space-y-4">
      {decisionPreview ? (
        <div className="border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Recommended Action</p>
          <p className="text-neutral-900 font-semibold">{decisionPreview.nextStep}</p>
          <p className="text-neutral-600">{decisionPreview.rationale}</p>
          <p className="text-[11px] text-neutral-500">Confidence {Math.round(decisionPreview.confidence * 100)}%</p>
        </div>
      ) : (
        <p className="text-sm text-neutral-600">Describe the issue in Step 2 to see recommendations.</p>
      )}
      {decisionPreview?.prepBrief && (
        <div className="border border-neutral-200 bg-white p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">AI Prep Brief</p>
              <p className="text-neutral-900 font-semibold">{decisionPreview.projectType}</p>
            </div>
          </div>
          <p className="text-neutral-600">{decisionPreview.prepBrief.summary}</p>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Key Questions</p>
            <ul className="list-disc list-inside text-neutral-700">
              {decisionPreview.prepBrief.keyQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Trades</p>
              <ul className="text-neutral-700">
                {decisionPreview.prepBrief.recommendedTrades.map((trade) => (
                  <li key={trade}>{trade}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Supplies</p>
              <ul className="text-neutral-700">
                {decisionPreview.prepBrief.supplies.map((item) => (
                  <li key={item.item}>{item.item}{item.quantity ? ` · ${item.quantity}` : ''}{item.notes ? ` — ${item.notes}` : ''}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Walkthrough Date</p>
          <input
            type="datetime-local"
            value={walkthroughDate}
            onChange={(event) => setWalkthroughDate(event.target.value)}
            className="w-full border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Internal Notes</p>
          <input
            value={walkthroughNotes}
            onChange={(event) => setWalkthroughNotes(event.target.value)}
            placeholder="Prep notes"
            className="w-full border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleWizardSubmit('walkthrough')}
          disabled={!decisionPreview || submitting}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 disabled:opacity-60"
        >
          Book Walkthrough
        </button>
        <button
          type="button"
          onClick={() => handleWizardSubmit('nurture')}
          disabled={!decisionPreview || submitting}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 disabled:opacity-60"
        >
          Start Nurture Sequence
        </button>
        <button
          type="button"
          onClick={() => handleWizardSubmit('convert')}
          disabled={!decisionPreview || submitting}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 disabled:opacity-60"
        >
          Convert to Project
        </button>
        <button
          type="button"
          onClick={() => handleWizardSubmit('lead')}
          disabled={submitting}
          className="px-4 py-2 bg-[#143352] text-white disabled:opacity-60"
        >
          Save as Lead Only
        </button>
      </div>
    </section>
  );

  const renderStep = () => {
    if (step === 1) return contactStep;
    if (step === 2) return issueStep;
    return nextStepPanel;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Intake</p>
            <h3 className="text-xl font-heading font-semibold text-neutral-900">New Lead Intake</h3>
          </div>
          <button onClick={closeModal} className="text-sm text-neutral-500">Close</button>
        </div>
        {!successLead && <StepIndicator />}

        {successLead ? (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-4 text-emerald-900">
              <p className="font-semibold">Lead captured</p>
              <p className="text-sm">{successLead.companyName} — {successLead.contactName}</p>
              <p className="text-xs text-emerald-800">Status: {successLead.stage} · Channel: {successLead.intakeChannel}</p>
            </div>
            <div className="border border-neutral-200 p-4 space-y-2 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">Recommended Next Step</p>
              <p className="text-neutral-600">
                {(successLead.recommendedNextStep && LEAD_NEXT_STEP_LABELS[successLead.recommendedNextStep]) || 'Review intake details'}
              </p>
              {successLead.decisionNotes && <p className="text-neutral-500">{successLead.decisionNotes}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (successLead) {
                    saveWalkthroughDraftFromLead(successLead);
                  }
                  navigate('/walkthroughs?from=intake');
                  closeModal();
                }}
                className="px-4 py-2 border border-neutral-300 text-neutral-700"
              >
                Book Walkthrough
              </button>
              <button
                onClick={() => toast.success('Nurture sequence triggered')}
                className="px-4 py-2 border border-neutral-300 text-neutral-700"
              >
                Start Nurture Sequence
              </button>
              <button
                onClick={() => {
                  navigate('/leads');
                }}
                className="px-4 py-2 border border-neutral-300 text-neutral-700"
              >
                Convert to Project
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-[#143352] text-white"
              >
                Save as Lead Only
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {renderStep()}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={step === 1 ? closeModal : () => setStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 border border-neutral-300 text-neutral-600"
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step < 3 && (
                <button
                  type="button"
                  onClick={() => setStep((prev) => Math.min(3, prev + 1))}
                  disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                  className="px-4 py-2 bg-[#143352] text-white disabled:opacity-60"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
