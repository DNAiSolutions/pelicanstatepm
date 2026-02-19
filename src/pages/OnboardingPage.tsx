import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { userProfileService } from '../services/userProfileService';

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
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Owner / Founder');
  const [department, setDepartment] = useState('');
  const [teamSize, setTeamSize] = useState('1-5');
  const [accountType, setAccountType] = useState<'vendor' | 'staff'>('vendor');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setRole(profile.role_title ?? 'Owner / Founder');
      setDepartment(profile.department ?? '');
      setTeamSize(profile.team_size ?? '1-5');
      setAccountType(profile.requested_access ?? 'vendor');
    }
  }, [profile]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-neutral-500">You need to be signed in to complete onboarding.</p>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const status = accountType === 'vendor' ? 'approved' : 'pending';
      const accessGranted = accountType === 'vendor' ? 'vendor' : 'vendor';
      await userProfileService.upsertProfile({
        userId: user.id,
        fullName,
        roleTitle: role,
        department,
        teamSize,
        requestedAccess: accountType,
        status,
        accessGranted,
      });
      await refreshProfile();
      toast.success(
        accountType === 'vendor'
          ? 'Profile saved! You now have vendor access.'
          : 'Request submitted. An admin will approve staff access shortly.'
      );
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save onboarding details');
    } finally {
      setSubmitting(false);
    }
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
            Provide a few quick details so we can tailor the workspace and determine whether you should receive vendor or staff access.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:border-[#143352]"
              />
            </div>

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
              <label className="text-sm font-medium text-neutral-700 mb-2 block">What type of access do you need?</label>
              <div className="flex flex-col gap-3">
                <label className={`border px-4 py-3 cursor-pointer ${accountType === 'vendor' ? 'border-[#143352]' : 'border-neutral-200'}`}>
                  <input
                    type="radio"
                    name="accessType"
                    value="vendor"
                    checked={accountType === 'vendor'}
                    onChange={() => setAccountType('vendor')}
                    className="mr-3"
                  />
                  Vendor / Partner – limited access to assigned projects
                </label>
                <label className={`border px-4 py-3 cursor-pointer ${accountType === 'staff' ? 'border-[#143352]' : 'border-neutral-200'}`}>
                  <input
                    type="radio"
                    name="accessType"
                    value="staff"
                    checked={accountType === 'staff'}
                    onChange={() => setAccountType('staff')}
                    className="mr-3"
                  />
                  Pelican State Staff – requires approval before full access
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#143352] text-white py-3 text-sm font-semibold hover:bg-[#0F1F2D] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save My Preferences'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Admins approve staff requests inside the Members tab.</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-[#143352] hover:underline"
            >
              Return to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
