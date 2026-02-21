import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileData } from '../hooks/useProfileData';
import { useAuth } from '../context/AuthContext';
import { NewRequestForm } from '../components/workRequests/NewRequestForm';
import type { WorkRequest, Property, Contact } from '../types';

const mapContact = (contact: Contact) => ({
  id: contact.id,
  name: contact.name,
  company: contact.company,
  email: contact.email,
  phone: contact.phone,
  propertyId: contact.property_id,
  statusLabel: contact.client_portal_enabled ? 'Portal' : 'Client',
});

const mapProperty = (property: Property) => ({
  id: property.id,
  name: property.name,
  address: property.address,
});

export function WorkRequestIntakePage() {
  const navigate = useNavigate();
  const { contacts, properties } = useProfileData();
  const { user } = useAuth();

  const clientContacts = useMemo(() => contacts.filter((contact) => contact.type === 'Client'), [contacts]);
  const contactOptions = useMemo(() => clientContacts.map(mapContact), [clientContacts]);
  const propertyOptions = useMemo(() => properties.map(mapProperty), [properties]);

  const handleSuccess = (request: WorkRequest) => {
    navigate(`/work-requests/${request.id}`);
  };

  if (contactOptions.length === 0 || propertyOptions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-16">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Requests</p>
          <h1 className="text-3xl font-heading text-neutral-900">Add a client and property first</h1>
          <p className="text-sm text-neutral-600">
            You need at least one client contact and property assignment before logging a work request. Add them from the
            Clients or Properties workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <NewRequestForm
        mode="internal"
        contacts={contactOptions}
        properties={propertyOptions}
        createdById={user?.id}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
