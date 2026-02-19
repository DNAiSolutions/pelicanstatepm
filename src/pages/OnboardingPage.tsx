import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const roleOptions = [
  'Owner / Founder',
  'Operations Manager',
  'Finance / Accounting',
  'Field Supervisor',
  'Project Manager',
  'Other',
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Owner / Founder');
  const [department, setDepartment] = useState('');
  const [teamSize, setTeamSize] = useState('1-5');
  const [priorities, setPriorities] = useState('');
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    const pending = localStorage.getItem('pelican-onboarding-required');
    setHasPending(Boolean(pending));
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      role,
      department,
      teamSize,
      priorities,
      capturedAt: new Date().toISOString(),
    };
    localStorage.setItem('pelican-onboarding-data', JSON.stringify(payload));
    localStorage.removeItem('pelican-onboarding-required');
    toast.success('Thanks! Your preferences have been saved.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fb]">
      <div className="hidden lg:flex lg:w-1/2 bg-[#143352] text-white p-12 flex-col justify-center">
        <div className="max-w-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 flex items-center justify-center rounded-full">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold">Pelican State</h1>
              <p className="text-white/80">Project & Facilities Operations</p>
            </div>
          </div>
          <p className="text-white/80 leading-relaxed">
            Tell us about your role so we can personalize dashboards, alerts, and workflows for your team.
            This takes less than a minute and helps surface the metrics that matter most to you after login.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white border border-neutral-200 p-8">
          <div className="flex items-center gap-3 mb-4 text-[#143352]">
            <ClipboardList className="w-6 h-6" />
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-500">Welcome</p>
              <h2 className="text-2xl font-heading font-semibold">Tell us about your role</h2>
            </div>
          </div>
          <p className="text-sm text-neutral-500 mb-6">
            {hasPending
              ? 'Thanks for signing up! We just need a few quick details to tailor the workspace to you.'
              : 'Already have an account? You can still update your preferences below.'}
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">What best describes your role?</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:border-[#143352]"
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Department / Focus Area</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Operations, Finance, Facilities"
                className="w-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:border-[#143352]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Team size you oversee</label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:border-[#143352]"
              >
                <option value="1-5">1-5</option>
                <option value="6-15">6-15</option>
                <option value="16-50">16-50</option>
                <option value="50+">50+</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Top priorities right now</label>
              <textarea
                value={priorities}
                onChange={(e) => setPriorities(e.target.value)}
                rows={4}
                placeholder="e.g. Speeding up approvals, tracking invoices, balancing workloads"
                className="w-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:border-[#143352]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#143352] text-white py-3 text-sm font-semibold hover:bg-[#0F1F2D] transition-colors"
            >
              Save My Preferences
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Your answers stay private to your workspace.</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#143352] hover:underline"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
