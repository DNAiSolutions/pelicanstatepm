import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContactPortalData } from '../hooks/useContactPortalData';
import { NewRequestForm } from '../components/workRequests/NewRequestForm';
import { getContactById, mockProperties } from '../data/pipeline';
import type { WorkRequest, Contact } from '../types';
import { useAuth } from '../context/AuthContext';
import { contactService } from '../services/contactService';
import { propertyService } from '../services/propertyService';
import toast from 'react-hot-toast';

const mapContact = (contact: Contact) => ({
  id: contact.id,
  name: contact.name,
  company: contact.company,
  email: contact.email,
  phone: contact.phone,
  propertyId: contact.property_id,
});

const mapProperty = (property: any) => ({
  id: property.id,
  name: property.name,
  address: property.address,
});

export function PortalRequestFormPage() {
  const [params] = useSearchParams();
  const contactId = params.get('contactId');
  const contactFromStore = contactId ? getContactById(contactId) : undefined;
  const portalData = useContactPortalData(contactId);
  const contact = portalData.contact || contactFromStore;
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDemoProfile = (user?.email ?? '').toLowerCase() === 'demo@pelicanstate.com';

  const [remoteContacts, setRemoteContacts] = useState<ReturnType<typeof mapContact>[]>([]);
  const [remoteProperties, setRemoteProperties] = useState<ReturnType<typeof mapProperty>[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(!isDemoProfile);

  useEffect(() => {
    if (isDemoProfile) return;
    let isMounted = true;
    async function loadPortalFormData() {
      try {
        setLoadingRemote(true);
        const [contactData, propertyData] = await Promise.all([
          contactId ? contactService.getById(contactId) : contactService.list(),
          propertyService.getProperties(),
        ]);
        if (!isMounted) return;

        const contactRecords: Contact[] = Array.isArray(contactData)
          ? contactData.filter((entry) => entry.client_portal_enabled)
          : contactData
          ? [contactData]
          : [];

        setRemoteContacts(contactRecords.map(mapContact));

        let filteredProperties = propertyData.map(mapProperty);
        const propertyIds = new Set(
          contactRecords.map((entry) => entry.property_id).filter((value): value is string => Boolean(value))
        );
        if (propertyIds.size > 0) {
          filteredProperties = filteredProperties.filter((property) => propertyIds.has(property.id));
        }

        setRemoteProperties(filteredProperties.length ? filteredProperties : propertyData.map(mapProperty));
      } catch (error) {
        console.error('Unable to load portal form data', error);
        toast.error('Unable to load portal form data');
      } finally {
        if (isMounted) setLoadingRemote(false);
      }
    }
    loadPortalFormData();
    return () => {
      isMounted = false;
    };
  }, [isDemoProfile, contactId]);

  const allowedPropertyIds = useMemo(() => {
    const ids = new Set<string>();
    portalData.projects.forEach((project: any) => {
      if (project.propertyId) ids.add(project.propertyId);
    });
    if ((contact as any)?.propertyId) ids.add((contact as any).propertyId);
    return ids;
  }, [portalData.projects, contact]);

  const demoPropertyOptions = useMemo(() => {
    if (allowedPropertyIds.size === 0) return mockProperties.map(mapProperty);
    return mockProperties.filter((property) => allowedPropertyIds.has(property.id)).map(mapProperty);
  }, [allowedPropertyIds]);

  const demoContacts = useMemo(() => {
    if (contact) return [mapContact(contact as any)];
    if (portalData.contact) return [mapContact(portalData.contact as any)];
    return [];
  }, [contact, portalData.contact]);

  const contacts = isDemoProfile ? demoContacts : remoteContacts;
  const propertyOptions = isDemoProfile ? demoPropertyOptions : remoteProperties;

  const contactQuery = contactId ? `?contactId=${contactId}` : '';

  const handleSuccess = (request: WorkRequest) => {
    navigate(`/client-portal/requests${contactQuery}`, { replace: true, state: { requestId: request.id } });
  };

  if (!isDemoProfile && loadingRemote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center text-neutral-600">Loading portal form…</div>
      </div>
    );
  }

  if (!contacts.length || !propertyOptions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 text-center space-y-3 max-w-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Client Portal</p>
          <h1 className="text-2xl font-heading text-neutral-900">Missing portal contact</h1>
          <p className="text-sm text-neutral-600">Ask your Pelican State account manager to enable portal access before submitting a request.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Client Portal</p>
            <h1 className="text-2xl font-heading font-bold text-neutral-900">Submit a new request</h1>
            {contact && <p className="text-sm text-neutral-600">For {contact.name}</p>}
          </div>
          <button
            onClick={() => navigate(`/client-portal/requests${contactQuery}`)}
            className="text-sm text-[#0f2749] underline"
          >
            Back to requests
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <NewRequestForm
          mode="portal"
          contacts={contacts}
          properties={propertyOptions}
          defaultContactId={contacts[0]?.id}
          defaultPropertyId={propertyOptions[0]?.id}
          contactLocked
          createdById="portal-client"
          onSuccess={handleSuccess}
        />
      </main>
    </div>
  );
}
