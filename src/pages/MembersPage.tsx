import { useEffect, useState } from 'react';
import { userProfileService, type UserProfile } from '../services/userProfileService';
import toast from 'react-hot-toast';
import { Check, Clock, ShieldAlert } from 'lucide-react';

export function MembersPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await userProfileService.listProfiles();
      setProfiles(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleApprove = async (profile: UserProfile) => {
    try {
      setUpdatingId(profile.user_id);
      await userProfileService.updateAccess(profile.user_id, {
        status: 'approved',
        access_granted: profile.requested_access === 'staff' ? 'staff' : 'vendor',
      });
      toast.success('Access updated');
      await loadProfiles();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update access');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#143352]/10 text-[#143352]">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-neutral-900">Members & Access</h1>
          <p className="text-sm text-neutral-500">
            Approve internal team members before granting staff-level access. Vendors remain limited to their workspace.
          </p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="grid grid-cols-6 text-xs font-semibold text-neutral-500 uppercase tracking-wide border-b border-neutral-100">
          <div className="py-3 px-4 col-span-2">User</div>
          <div className="py-3 px-4">Role</div>
          <div className="py-3 px-4">Requested</div>
          <div className="py-3 px-4">Status</div>
          <div className="py-3 px-4 text-right">Action</div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-neutral-500">Loading profiles…</div>
        ) : profiles.length === 0 ? (
          <div className="p-6 text-sm text-neutral-500">No members yet.</div>
        ) : (
          profiles.map((profile) => (
            <div key={profile.user_id} className="grid grid-cols-6 border-b border-neutral-100 last:border-b-0">
              <div className="py-4 px-4 col-span-2">
                <p className="text-sm font-medium text-neutral-900">{profile.full_name || profile.user_id}</p>
                <p className="text-xs text-neutral-500">{profile.department || '—'}</p>
              </div>
              <div className="py-4 px-4">
                <p className="text-sm text-neutral-900">{profile.role_title || '—'}</p>
                <p className="text-xs text-neutral-500">Team {profile.team_size || '—'}</p>
              </div>
              <div className="py-4 px-4">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  profile.requested_access === 'staff'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {profile.requested_access === 'staff' ? 'Staff' : 'Vendor'}
                </span>
              </div>
              <div className="py-4 px-4">
                {profile.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                    <Check className="w-4 h-4" /> Approved
                  </span>
                ) : profile.status === 'pending' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600">
                    <Clock className="w-4 h-4" /> Pending
                  </span>
                ) : (
                  <span className="text-xs font-medium text-red-600">Denied</span>
                )}
              </div>
              <div className="py-4 px-4 text-right">
                {profile.status === 'approved' ? (
                  <span className="text-xs text-neutral-400">Active</span>
                ) : (
                  <button
                    onClick={() => handleApprove(profile)}
                    className="px-3 py-1 text-xs font-semibold border border-[#143352] text-[#143352] hover:bg-[#143352] hover:text-white transition-colors"
                    disabled={updatingId === profile.user_id}
                  >
                    {updatingId === profile.user_id ? 'Updating…' : 'Approve'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
